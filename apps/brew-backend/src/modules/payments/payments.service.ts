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

  constructor(
    private readonly gateway: PaymentAdapter,
    private readonly events: EventBus,
  ) {}

  async create(
    input: { orderId: string; method: Payment['method']; amountPaise: number },
    idempotencyKey: string,
  ): Promise<Payment> {
    // Idempotency: same key returns the same payment (prevents double-charge).
    const existingId = this.byIdempotencyKey.get(idempotencyKey);
    if (existingId) return this.byId.get(existingId)!;

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
    return payment;
  }

  async handleWebhook(rawBody: string, signature: string): Promise<void> {
    if (!this.gateway.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }
    const evt = JSON.parse(rawBody) as { gatewayOrderId?: string; storeId?: string };
    const payment = [...this.byId.values()].find((p) => p.gatewayOrderId === evt.gatewayOrderId);
    if (!payment) return;
    payment.status = 'CAPTURED';
    await this.events.publish({
      name: DomainEvents.PaymentCaptured,
      storeId: evt.storeId ?? 'unknown',
      occurredAt: new Date().toISOString(),
      eventId: randomUUID(),
      data: { paymentId: payment.id, orderId: payment.orderId },
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
