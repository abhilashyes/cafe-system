import type { Id } from './hierarchy';

export type PaymentMethod =
  | 'UPI_INTENT'
  | 'UPI_COLLECT'
  | 'UPI_QR'
  | 'CARD'
  | 'WALLET'
  | 'NETBANKING'
  | 'CASH';

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'CAPTURED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface Payment {
  id: Id;
  orderId: Id;
  method: PaymentMethod;
  status: PaymentStatus;
  amountPaise: number;
  /** Razorpay order/payment ids (null for cash). */
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  /** Idempotency key required on create to prevent double-charge. */
  idempotencyKey: string;
  refunds: Refund[];
  createdAt: string;
}

export interface Refund {
  id: Id;
  amountPaise: number; // supports partial refunds
  reason?: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  createdAt: string;
}

/** Razorpay webhook envelope — signature MUST be verified before trust. */
export interface RazorpayWebhook {
  event: string;
  signature: string;
  payload: unknown;
}
