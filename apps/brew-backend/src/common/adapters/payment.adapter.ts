import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { notConfigured } from '../config/profile';

export interface GatewayOrder {
  gatewayOrderId: string;
  amountPaise: number;
  /** For UPI intent: a upi:// deep link; for QR: the QR string. */
  upiIntent?: string;
}

/** Port for the payment gateway. Prod impl = Razorpay; dev impl = mock. */
export abstract class PaymentAdapter {
  abstract createOrder(amountPaise: number, idempotencyKey: string): Promise<GatewayOrder>;
  abstract refund(gatewayPaymentId: string, amountPaise?: number): Promise<{ refundId: string }>;
  /** Verify webhook HMAC signature before trusting the payload. */
  abstract verifyWebhookSignature(rawBody: string, signature: string): boolean;
}

/** Mock Razorpay adapter — no network calls. */
@Injectable()
export class MockPaymentAdapter extends PaymentAdapter {
  private readonly logger = new Logger(MockPaymentAdapter.name);

  async createOrder(amountPaise: number, idempotencyKey: string): Promise<GatewayOrder> {
    this.logger.log(`[mock] create gateway order ${amountPaise}p idem=${idempotencyKey}`);
    const id = `order_${randomUUID().slice(0, 12)}`;
    return {
      gatewayOrderId: id,
      amountPaise,
      upiIntent: `upi://pay?pa=brew@upi&am=${(amountPaise / 100).toFixed(2)}&tn=${id}`,
    };
  }

  async refund(gatewayPaymentId: string, amountPaise?: number) {
    this.logger.log(`[mock] refund ${gatewayPaymentId} ${amountPaise ?? 'FULL'}`);
    return { refundId: `rfnd_${randomUUID().slice(0, 12)}` };
  }

  verifyWebhookSignature(_rawBody: string, signature: string): boolean {
    // Prod: HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET) === signature.
    return signature === 'mock-valid-signature';
  }
}

/**
 * Live Razorpay adapter (selected by BREW_PROFILE=live). Real UPI intent/collect,
 * card orders, refunds and HMAC-SHA256 webhook verification land in milestone M4.
 * Bound at the composition root now; calling it before M4 fails loudly. Webhook
 * verification deliberately returns `false` rather than throwing, so an
 * unconfigured live deployment rejects unverified webhooks instead of trusting
 * them (fail-closed).
 */
@Injectable()
export class LivePaymentAdapter extends PaymentAdapter {
  async createOrder(_amountPaise: number, _idempotencyKey: string): Promise<GatewayOrder> {
    throw notConfigured('Razorpay payments', 'M4 (Payments)');
  }

  async refund(_gatewayPaymentId: string, _amountPaise?: number): Promise<{ refundId: string }> {
    throw notConfigured('Razorpay payments', 'M4 (Payments)');
  }

  verifyWebhookSignature(_rawBody: string, _signature: string): boolean {
    return false; // fail-closed until M4 wires real HMAC verification
  }
}
