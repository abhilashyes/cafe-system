import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DomainEvents, type Payment } from '@brew/contracts';
import { EventBus } from '../../common/events/event-bus';
import { PaymentAdapter } from '../../common/adapters/payment.adapter';
import { PaymentRepository, type PaymentRecord } from './payment.repository';

/** Payments domain — Razorpay behind PaymentAdapter. Idempotency + webhook verify.
 * Persisted via PaymentRepository (in-memory in demo, Postgres in live). */
@Injectable()
export class PaymentsService {
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
    private readonly repo: PaymentRepository,
  ) {}

  async create(
    input: { orderId: string; storeId: string; method: Payment['method']; amountPaise: number },
    idempotencyKey: string,
  ): Promise<Payment & { upiIntent?: string }> {
    // Idempotency: same key returns the same payment (prevents double-charge).
    const existing = await this.repo.findByIdempotencyKey(idempotencyKey);
    if (existing) return existing;

    const gatewayOrder =
      input.method === 'CASH'
        ? undefined
        : await this.gateway.createOrder(input.amountPaise, idempotencyKey);

    const payment: PaymentRecord = {
      id: randomUUID(),
      orderId: input.orderId,
      method: input.method,
      status: input.method === 'CASH' ? 'CAPTURED' : 'CREATED',
      amountPaise: input.amountPaise,
      gatewayOrderId: gatewayOrder?.gatewayOrderId,
      idempotencyKey,
      refunds: [],
      createdAt: new Date().toISOString(),
      storeId: input.storeId,
      upiIntent: gatewayOrder?.upiIntent,
    };

    // Demo auto-capture: stand in for the gateway webhook so the flow completes.
    if (payment.status !== 'CAPTURED' && this.autoCapture) {
      payment.status = 'CAPTURED';
      payment.gatewayPaymentId = `pay_demo_${randomUUID().slice(0, 8)}`;
    }

    await this.repo.save(payment);
    // Cash (and demo auto-capture) is captured immediately — emit now.
    if (payment.status === 'CAPTURED') await this.emitCaptured(payment);
    return payment;
  }

  async handleWebhook(rawBody: string, signature: string): Promise<void> {
    if (!this.gateway.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }
    const evt = JSON.parse(rawBody) as { gatewayOrderId?: string; gatewayPaymentId?: string };
    if (!evt.gatewayOrderId) return;
    const payment = await this.repo.findByGatewayOrderId(evt.gatewayOrderId);
    if (!payment || payment.status === 'CAPTURED') return; // idempotent on replay
    payment.status = 'CAPTURED';
    if (evt.gatewayPaymentId) payment.gatewayPaymentId = evt.gatewayPaymentId;
    await this.repo.save(payment);
    await this.emitCaptured(payment);
  }

  private async emitCaptured(payment: PaymentRecord): Promise<void> {
    await this.events.publish({
      name: DomainEvents.PaymentCaptured,
      storeId: payment.storeId,
      occurredAt: new Date().toISOString(),
      eventId: randomUUID(),
      data: { paymentId: payment.id, orderId: payment.orderId, amountPaise: payment.amountPaise },
    });
  }

  async refund(paymentId: string, amountPaise?: number): Promise<Payment> {
    const payment = await this.repo.get(paymentId);
    if (!payment) throw new BadRequestException('Unknown payment');
    if (payment.gatewayPaymentId) await this.gateway.refund(payment.gatewayPaymentId, amountPaise);
    payment.refunds.push({
      id: randomUUID(),
      amountPaise: amountPaise ?? payment.amountPaise,
      status: 'PROCESSED',
      createdAt: new Date().toISOString(),
    });
    payment.status = amountPaise && amountPaise < payment.amountPaise ? 'PARTIALLY_REFUNDED' : 'REFUNDED';
    await this.repo.save(payment);
    return payment;
  }
}
