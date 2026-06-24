import { Injectable } from '@nestjs/common';
import type { Payment } from '@brew/contracts';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Internal payment record = contract Payment + the storeId/upiIntent we persist. */
export interface PaymentRecord extends Payment {
  storeId: string;
  upiIntent?: string;
}

export abstract class PaymentRepository {
  abstract save(rec: PaymentRecord): Promise<void>;
  abstract get(id: string): Promise<PaymentRecord | undefined>;
  abstract findByIdempotencyKey(key: string): Promise<PaymentRecord | undefined>;
  abstract findByGatewayOrderId(gatewayOrderId: string): Promise<PaymentRecord | undefined>;
}

@Injectable()
export class InMemoryPaymentRepository extends PaymentRepository {
  private readonly byId = new Map<string, PaymentRecord>();

  async save(rec: PaymentRecord): Promise<void> {
    this.byId.set(rec.id, structuredClone(rec));
  }

  async get(id: string): Promise<PaymentRecord | undefined> {
    const r = this.byId.get(id);
    return r ? structuredClone(r) : undefined;
  }

  async findByIdempotencyKey(key: string): Promise<PaymentRecord | undefined> {
    const r = [...this.byId.values()].find((p) => p.idempotencyKey === key);
    return r ? structuredClone(r) : undefined;
  }

  async findByGatewayOrderId(gatewayOrderId: string): Promise<PaymentRecord | undefined> {
    const r = [...this.byId.values()].find((p) => p.gatewayOrderId === gatewayOrderId);
    return r ? structuredClone(r) : undefined;
  }
}

@Injectable()
export class PrismaPaymentRepository extends PaymentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async save(rec: PaymentRecord): Promise<void> {
    const head = {
      orderId: rec.orderId,
      method: rec.method,
      status: rec.status,
      amountPaise: rec.amountPaise,
      gatewayOrderId: rec.gatewayOrderId ?? null,
      gatewayPaymentId: rec.gatewayPaymentId ?? null,
      idempotencyKey: rec.idempotencyKey,
      upiIntent: rec.upiIntent ?? null,
      storeId: rec.storeId,
    };
    const refunds = rec.refunds.map((r) => ({
      id: r.id,
      paymentId: rec.id,
      amountPaise: r.amountPaise,
      status: r.status,
      createdAt: new Date(r.createdAt),
    }));
    await this.prisma.$transaction([
      this.prisma.payment.upsert({
        where: { id: rec.id },
        create: { id: rec.id, createdAt: new Date(rec.createdAt), ...head },
        update: head,
      }),
      this.prisma.refund.deleteMany({ where: { paymentId: rec.id } }),
      this.prisma.refund.createMany({ data: refunds }),
    ]);
  }

  async get(id: string): Promise<PaymentRecord | undefined> {
    const row = await this.prisma.payment.findUnique({ where: { id }, include: { refunds: true } });
    return row ? toRecord(row) : undefined;
  }

  async findByIdempotencyKey(key: string): Promise<PaymentRecord | undefined> {
    const row = await this.prisma.payment.findUnique({
      where: { idempotencyKey: key },
      include: { refunds: true },
    });
    return row ? toRecord(row) : undefined;
  }

  async findByGatewayOrderId(gatewayOrderId: string): Promise<PaymentRecord | undefined> {
    const row = await this.prisma.payment.findFirst({
      where: { gatewayOrderId },
      include: { refunds: true },
    });
    return row ? toRecord(row) : undefined;
  }
}

function toRecord(row: any): PaymentRecord {
  return {
    id: row.id,
    orderId: row.orderId,
    method: row.method,
    status: row.status,
    amountPaise: row.amountPaise,
    gatewayOrderId: row.gatewayOrderId ?? undefined,
    gatewayPaymentId: row.gatewayPaymentId ?? undefined,
    idempotencyKey: row.idempotencyKey,
    storeId: row.storeId,
    upiIntent: row.upiIntent ?? undefined,
    refunds: (row.refunds ?? []).map((r: any) => ({
      id: r.id,
      amountPaise: r.amountPaise,
      status: r.status,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}
