import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  DomainEvents,
  type ConsentPurpose,
  type ConsentRecord,
  type DataSubjectRequest,
  type DsrType,
  type RetentionPolicy,
} from '@brew/contracts';
import { EventBus } from '../../common/events/event-bus';
import { OrderingService } from '../ordering/ordering.service';
import { LoyaltyService } from '../loyalty/loyalty.service';

const NOTICE_VERSION = '2024-01';

const RETENTION_POLICIES: RetentionPolicy[] = [
  { dataCategory: 'order', retainDays: null, action: 'ANONYMIZE' }, // financial: statutory
  { dataCategory: 'payment', retainDays: null, action: 'ANONYMIZE' },
  { dataCategory: 'marketing_profile', retainDays: 365, action: 'DELETE' },
  { dataCategory: 'device_token', retainDays: 540, action: 'DELETE' },
  { dataCategory: 'consent_record', retainDays: 2555, action: 'DELETE' }, // ~7y evidentiary
];

/** Privacy & Consent (DPDP Act 2023) — consent ledger, DSRs, export, erasure. */
@Injectable()
export class PrivacyService {
  private readonly consents: ConsentRecord[] = [];
  private readonly dsrs: DataSubjectRequest[] = [];

  constructor(
    private readonly events: EventBus,
    private readonly ordering: OrderingService,
    private readonly loyalty: LoyaltyService,
  ) {}

  getConsents(customerId: string): ConsentRecord[] {
    return this.consents.filter((c) => c.customerId === customerId);
  }

  async setConsent(customerId: string, purpose: ConsentPurpose, granted: boolean) {
    const record: ConsentRecord = {
      id: randomUUID(),
      customerId,
      purpose,
      granted,
      noticeVersion: NOTICE_VERSION,
      occurredAt: new Date().toISOString(),
    };
    this.consents.push(record);
    await this.events.publish({
      name: DomainEvents.ConsentChanged,
      storeId: 'org',
      occurredAt: record.occurredAt,
      eventId: randomUUID(),
      data: { customerId, purpose, granted },
    });
    return record;
  }

  /** Latest-wins consent check used by Notifications before marketing sends. */
  hasConsent(customerId: string, purpose: ConsentPurpose): boolean {
    const latest = [...this.consents]
      .filter((c) => c.customerId === customerId && c.purpose === purpose)
      .at(-1);
    return latest?.granted ?? false;
  }

  createDsr(customerId: string, type: DsrType): DataSubjectRequest {
    const dsr: DataSubjectRequest = {
      id: randomUUID(),
      customerId,
      type,
      status: 'OPEN',
      // DPDP SLA placeholder: 30 days.
      slaDueAt: new Date(Date.now() + 30 * 864e5).toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.dsrs.push(dsr);
    return dsr;
  }

  listRetentionPolicies(): RetentionPolicy[] {
    return RETENTION_POLICIES;
  }

  /** Data portability — aggregate everything held about a data principal. */
  exportData(customerId: string) {
    return {
      customerId,
      exportedAt: new Date().toISOString(),
      consents: this.getConsents(customerId),
      loyalty: {
        account: this.loyalty.getAccount(customerId),
        ledger: this.loyalty.getLedger(customerId),
      },
      orders: this.ordering.listByCustomer(customerId),
    };
  }

  /**
   * Right to erasure: withdraw consents and pseudonymize the customer on retained
   * financial records (kept per tax law). Records a fulfilled ERASURE DSR.
   */
  async erase(customerId: string) {
    for (const purpose of ['TRANSACTIONAL', 'MARKETING', 'ANALYTICS'] as ConsentPurpose[]) {
      if (this.hasConsent(customerId, purpose)) await this.setConsent(customerId, purpose, false);
    }
    const ordersAnonymized = this.ordering.anonymizeCustomer(customerId);
    const dsr = this.createDsr(customerId, 'ERASURE');
    dsr.status = 'FULFILLED';
    return { customerId, ordersAnonymized, status: 'ERASED' as const };
  }
}
