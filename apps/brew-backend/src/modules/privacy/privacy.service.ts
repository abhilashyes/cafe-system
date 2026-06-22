import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  DomainEvents,
  type ConsentPurpose,
  type ConsentRecord,
  type DataSubjectRequest,
  type DsrType,
} from '@brew/contracts';
import { EventBus } from '../../common/events/event-bus';

const NOTICE_VERSION = '2024-01';

/** Privacy & Consent (DPDP Act 2023) — consent ledger, DSRs, retention. */
@Injectable()
export class PrivacyService {
  private readonly consents: ConsentRecord[] = [];
  private readonly dsrs: DataSubjectRequest[] = [];

  constructor(private readonly events: EventBus) {}

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
}
