import { Injectable } from '@nestjs/common';
import type { Order, OrderItem } from '@brew/contracts';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Persistence port for orders. In-memory (demo) | Postgres (live), bound in OrderingModule. */
export abstract class OrderRepository {
  abstract save(order: Order): Promise<void>;
  abstract get(id: string): Promise<Order | undefined>;
  abstract listByCustomer(customerId: string): Promise<Order[]>;
  /** DPDP pseudonymisation: scrub customer identity, keep financial figures. */
  abstract anonymizeCustomer(customerId: string): Promise<number>;
}

@Injectable()
export class InMemoryOrderRepository extends OrderRepository {
  private readonly orders = new Map<string, Order>();

  async save(order: Order): Promise<void> {
    this.orders.set(order.id, structuredClone(order));
  }

  async get(id: string): Promise<Order | undefined> {
    const o = this.orders.get(id);
    return o ? structuredClone(o) : undefined;
  }

  async listByCustomer(customerId: string): Promise<Order[]> {
    return [...this.orders.values()].filter((o) => o.customerId === customerId).map((o) => structuredClone(o));
  }

  async anonymizeCustomer(customerId: string): Promise<number> {
    let count = 0;
    for (const o of this.orders.values()) {
      if (o.customerId === customerId) {
        o.customerId = undefined;
        o.customerName = 'REDACTED';
        count++;
      }
    }
    return count;
  }
}

@Injectable()
export class PrismaOrderRepository extends OrderRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async save(order: Order): Promise<void> {
    const head = {
      storeId: order.storeId,
      channel: order.channel,
      fulfilment: order.fulfilment,
      tableNumber: order.tableNumber ?? null,
      customerId: order.customerId ?? null,
      customerName: order.customerName ?? null,
      pickupCode: order.pickupCode,
      status: order.status,
      scheduledFor: order.scheduledFor ?? null,
      subtotalPaise: order.totals.subtotalPaise,
      cgstPaise: order.totals.cgstPaise,
      sgstPaise: order.totals.sgstPaise,
      igstPaise: order.totals.igstPaise,
      discountPaise: order.totals.discountPaise,
      grandTotalPaise: order.totals.grandTotalPaise,
    };
    const items = order.items.map((i) => ({
      id: i.id,
      orderId: order.id,
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
      unitPricePaise: i.unitPricePaise,
      status: i.status,
      // Stored as jsonb; modifiers are plain JSON-serialisable objects.
      modifiers: (i.modifiers ?? []) as unknown as object[],
    }));
    // Upsert head, then replace items (statuses change on bump/ready).
    await this.prisma.$transaction([
      this.prisma.order.upsert({
        where: { id: order.id },
        create: { id: order.id, createdAt: new Date(order.createdAt), ...head },
        update: head,
      }),
      this.prisma.orderItem.deleteMany({ where: { orderId: order.id } }),
      this.prisma.orderItem.createMany({ data: items }),
    ]);
  }

  async get(id: string): Promise<Order | undefined> {
    const row = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    return row ? toOrder(row) : undefined;
  }

  async listByCustomer(customerId: string): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toOrder);
  }

  async anonymizeCustomer(customerId: string): Promise<number> {
    const res = await this.prisma.order.updateMany({
      where: { customerId },
      data: { customerId: null, customerName: 'REDACTED' },
    });
    return res.count;
  }
}

/** Map a Prisma order row (+items) back to the contract Order shape. */
function toOrder(row: any): Order {
  return {
    id: row.id,
    storeId: row.storeId,
    channel: row.channel,
    fulfilment: row.fulfilment,
    tableNumber: row.tableNumber ?? undefined,
    customerId: row.customerId ?? undefined,
    customerName: row.customerName ?? undefined,
    pickupCode: row.pickupCode,
    status: row.status,
    scheduledFor: row.scheduledFor ?? undefined,
    items: (row.items ?? []).map(
      (i: any): OrderItem => ({
        id: i.id,
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        unitPricePaise: i.unitPricePaise,
        status: i.status,
        modifiers: (i.modifiers ?? []) as OrderItem['modifiers'],
      }),
    ),
    totals: {
      subtotalPaise: row.subtotalPaise,
      cgstPaise: row.cgstPaise,
      sgstPaise: row.sgstPaise,
      igstPaise: row.igstPaise,
      discountPaise: row.discountPaise,
      grandTotalPaise: row.grandTotalPaise,
    },
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}
