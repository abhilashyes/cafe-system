import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DomainEvents, type Payment } from '@brew/contracts';
import { EventBus } from '../../common/events/event-bus';
import { PaymentAdapter } from '../../common/adapters/payment.adapter';

/** Payments domain — Razorpay behind PaymentAdapter. Idempotency + webhook verify. */
@Injectable()
export class PaymentsService {
  private readonly byId = new Map<string, Payment>();
  private readonly byIdempotencyKey = new Map<string, string>();
  /** storeId is needed to scope the PaymentCaptured event but isn't on Payment. */
  private readonly storeOf = new Map<string, string>();
  /** UPI intent deep link returned by the gateway, surfaced to the client. */
  private readonly upiIntentOf = new Map<string, string>();
  /**
   * Demo-only: with no real Razorpay webhook to call back, auto-capture non-cash
   * payments so the flow (loyalty/inventory/reporting) advances for the hosted
   * demo. Off by default (tests still exercise the real webhook-driven capture);
   * enabled in the deployed demo via BREW_AUTOCAPTURE=true.
   */
  private readonly autoCapture = process.env.BREW_AUTOCAPTURE === 'true';

  constructor(
    private readonly gateway: PaymentAdapter,
    private readonly events: EventBus,
  ) {}

  async create(
    input: { orderId: string; storeId: string; method: Payment['method']; amountPaise: number },
    idempotencyKey: string,
  ): Promise<Payment & { upiIntent?: string }> {
    // Idempotency: same key returns the same payment (prevents double-charge).
    const existingId = this.byIdempotencyKey.get(idempotencyKey);
    if (existingId) {
      const existing = this.byId.get(existingId)!;
      return { ...existing, upiIntent: this.upiIntentOf.get(existing.id) };
    }

    const gatewayOrder =
      input.method === 'CASH'
        ? undefined
        : await this.gateway.createOrder(input.amountPaise, idempotencyKey);

    const payment: Payment = {
      id: randomUUID(),
      orderId: input.orderId,
      method: input.method,
      status: input.method === 'CASH' ? 'CAPTURED' : 'CREATED',
      amountPaise: input.amountPaise,
      gatewayOrderId: gatewayOrder?.gatewayOrderId,
      idempotencyKey,
      refunds: [],
      createdAt: new Date().toISOString(),
    };
    this.byId.set(payment.id, payment);
    this.byIdempotencyKey.set(idempotencyKey, payment.id);
    this.storeOf.set(payment.id, input.storeId);
    if (gatewayOrder?.upiIntent) this.upiIntentOf.set(payment.id, gatewayOrder.upiIntent);

    // Demo auto-capture: stand in for the gateway webhook so the flow completes.
    if (payment.status !== 'CAPTURED' && this.autoCapture) {
      payment.status = 'CAPTURED';
      payment.gatewayPaymentId = `pay_demo_${randomUUID().slice(0, 8)}`;
    }

    // Cash is captured at the counter — emit immediately (no gateway round-trip).
    if (payment.status === 'CAPTURED') await this.emitCaptured(payment);
    return { ...payment, upiIntent: this.upiIntentOf.get(payment.id) };
  }


  async handleWebhook(rawBody: string, signature: string): Promise<void> {
    if (!this.gateway.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }
    const evt = JSON.parse(rawBody) as { gatewayOrderId?: string; gatewayPaymentId?: string };
    const payment = [...this.byId.values()].find((p) => p.gatewayOrderId === evt.gatewayOrderId);
    if (!payment || payment.status === 'CAPTURED') return; // idempotent on replay
    payment.status = 'CAPTURED';
    if (evt.gatewayPaymentId) payment.gatewayPaymentId = evt.gatewayPaymentId;
    await this.emitCaptured(payment);
  }

  private async emitCaptured(payment: Payment): Promise<void> {
    await this.events.publish({
      name: DomainEvents.PaymentCaptured,
      storeId: this.storeOf.get(payment.id) ?? 'unknown',
      occurredAt: new Date().toISOString(),
      eventId: randomUUID(),
      data: { paymentId: payment.id, orderId: payment.orderId, amountPaise: payment.amountPaise },
    });
  }

  async refund(paymentId: string, amountPaise?: number): Promise<Payment> {
    const payment = this.byId.get(paymentId);
    if (!payment) throw new BadRequestException('Unknown payment');
    if (payment.gatewayPaymentId) await this.gateway.refund(payment.gatewayPaymentId, amountPaise);
    payment.refunds.push({
      id: randomUUID(),
      amountPaise: amountPaise ?? payment.amountPaise,
      status: 'PROCESSED',
      createdAt: new Date().toISOString(),
    });
    payment.status = amountPaise && amountPaise < payment.amountPaise ? 'PARTIALLY_REFUNDED' : 'REFUNDED';
    return payment;
  }
}
