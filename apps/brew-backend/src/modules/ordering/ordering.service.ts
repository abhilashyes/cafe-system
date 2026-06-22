import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DomainEvents, type Order } from '@brew/contracts';
import { EventBus } from '../../common/events/event-bus';

export interface CreateOrderInput {
  storeId: string;
  channel: Order['channel'];
  fulfilment: Order['fulfilment'];
  tableNumber?: string;
  scheduledFor?: string;
  customerId?: string;
  items: Array<{ productId: string; quantity: number; modifierOptionIds?: string[] }>;
}

/**
 * Ordering domain (extraction-ready). Owns the order lifecycle and publishes
 * OrderPlaced so Payments, Inventory, KOT and Loyalty can react.
 * MOCK persistence: in-memory map (Aurora in prod, DynamoDB for live carts).
 */
@Injectable()
export class OrderingService {
  private readonly orders = new Map<string, Order>();

  constructor(private readonly events: EventBus) {}

  async create(input: CreateOrderInput): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      id,
      storeId: input.storeId,
      channel: input.channel,
      fulfilment: input.fulfilment,
      tableNumber: input.fulfilment === 'DINE_IN' ? input.tableNumber : undefined,
      customerId: input.customerId,
      pickupCode: this.pickupCode(),
      status: 'RECEIVED',
      items: input.items.map((it) => ({
        id: randomUUID(),
        productId: it.productId,
        name: `product:${it.productId}`,
        quantity: it.quantity,
        unitPricePaise: 0, // priced by Catalog in a full build
        modifiers: [],
        status: 'PENDING',
      })),
      scheduledFor: input.scheduledFor,
      totals: {
        subtotalPaise: 0,
        cgstPaise: 0,
        sgstPaise: 0,
        igstPaise: 0,
        discountPaise: 0,
        grandTotalPaise: 0,
      },
      createdAt: new Date().toISOString(),
    };
    this.orders.set(id, order);

    await this.events.publish({
      name: DomainEvents.OrderPlaced,
      storeId: order.storeId,
      occurredAt: order.createdAt,
      eventId: randomUUID(),
      data: { orderId: id },
    });
    return order;
  }

  get(id: string): Order | undefined {
    return this.orders.get(id);
  }

  async markReady(id: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    order.status = 'READY';
    order.items.forEach((i) => (i.status = 'READY'));
    await this.events.publish({
      name: DomainEvents.OrderReady,
      storeId: order.storeId,
      occurredAt: new Date().toISOString(),
      eventId: randomUUID(),
      data: { orderId: id },
    });
    return order;
  }

  private pickupCode(): string {
    return Math.random().toString(36).slice(2, 6).toUpperCase();
  }
}
