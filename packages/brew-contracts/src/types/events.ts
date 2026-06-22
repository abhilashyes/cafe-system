import type { Id } from './hierarchy';

/**
 * Domain event catalog. Modules publish these; consumers subscribe.
 * Transport is EventBridge/SNS+SQS in prod, in-memory in dev (see brew-backend).
 */
export const DomainEvents = {
  OrderPlaced: 'order.placed',
  PaymentCaptured: 'payment.captured',
  PaymentRefunded: 'payment.refunded',
  OrderReady: 'order.ready',
  OrderPickedUp: 'order.picked_up',
  InventoryDeducted: 'inventory.deducted',
  InventoryOutOfStock: 'inventory.out_of_stock',
  LoyaltyAccrued: 'loyalty.accrued',
  KotPrintRequested: 'kot.print_requested',
  ConsentChanged: 'privacy.consent_changed',
} as const;

export type DomainEventName = (typeof DomainEvents)[keyof typeof DomainEvents];

export interface DomainEvent<T = unknown> {
  name: DomainEventName;
  /** Tenancy scope for routing/filtering. */
  storeId: Id;
  occurredAt: string;
  /** Idempotency / dedupe key. */
  eventId: string;
  data: T;
}
