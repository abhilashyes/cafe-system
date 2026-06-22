import type { Id } from './hierarchy';

/** DPDP processing purposes — consent is captured per purpose. */
export type ConsentPurpose = 'TRANSACTIONAL' | 'MARKETING' | 'ANALYTICS';

export interface ConsentRecord {
  id: Id;
  customerId: Id;
  purpose: ConsentPurpose;
  granted: boolean;
  /** Versioned notice the consent was given against. */
  noticeVersion: string;
  occurredAt: string;
}

export type DsrType = 'ACCESS' | 'CORRECTION' | 'ERASURE' | 'PORTABILITY';

/** Data Subject Request — SLA-tracked. */
export interface DataSubjectRequest {
  id: Id;
  customerId: Id;
  type: DsrType;
  status: 'OPEN' | 'IN_PROGRESS' | 'FULFILLED' | 'REJECTED';
  slaDueAt: string;
  createdAt: string;
}

export interface RetentionPolicy {
  dataCategory: string; // e.g. "order", "payment", "marketing_profile"
  /** Null = retain per statutory requirement (e.g. tax records). */
  retainDays: number | null;
  action: 'DELETE' | 'ANONYMIZE';
}
