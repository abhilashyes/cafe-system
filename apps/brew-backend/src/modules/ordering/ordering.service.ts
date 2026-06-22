import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DomainEvents, type Order, type OrderItem, type OrderTotals } from '@brew/contracts';
import { EventBus } from '../../common/events/event-bus';
import { CatalogService } from '../catalog/catalog.service';

export interface CreateOrderInput {
  storeId: string;
  channel: Order['channel'];
  fulfilment: Order['fulfilment'];
  tableNumber?: string;
  scheduledFor?: string;
  customerId?: string;
  customerName?: string;
  items: Array<{ productId: string; quantity: number; modifierOptionIds?: string[] }>;
}

/**
 * Ordering domain (extraction-ready). Owns the order lifecycle, prices items via
 * Catalog (internal interface), computes GST, and publishes OrderPlaced so
 * Payments, Inventory, KOT, Loyalty and Reporting can react.
 * MOCK persistence: in-memory map (Aurora in prod, DynamoDB for live carts).
 */
@Injectable()
export class OrderingService {
  private readonly orders = new Map<string, Order>();

  constructor(
    private readonly events: EventBus,
    private readonly catalog: CatalogService,
  ) {}

  async create(input: CreateOrderInput): Promise<Order> {
    if (input.items.length === 0) throw new BadRequestException('Order has no items');
    const id = randomUUID();
    const items = input.items.map((it) => this.priceItem(it));
    const totals = this.computeTotals(items, input.storeId);

    const order: Order = {
      id,
      storeId: input.storeId,
      channel: input.channel,
      fulfilment: input.fulfilment,
      tableNumber: input.fulfilment === 'DINE_IN' ? input.tableNumber : undefined,
      customerId: input.customerId,
      customerName: input.customerName,
      pickupCode: this.pickupCode(),
      status: 'RECEIVED',
      items,
      scheduledFor: input.scheduledFor,
      totals,
      createdAt: new Date().toISOString(),
    };
    this.orders.set(id, order);

    await this.events.publish({
      name: DomainEvents.OrderPlaced,
      storeId: order.storeId,
      occurredAt: order.createdAt,
      eventId: randomUUID(),
      data: {
        orderId: id,
        customerId: order.customerId,
        channel: order.channel,
        items: order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        grandTotalPaise: totals.grandTotalPaise,
      },
    });
    return order;
  }

  /** Price a single line: base + modifier deltas, resolved against Catalog. */
  private priceItem(input: {
    productId: string;
    quantity: number;
    modifierOptionIds?: string[];
  }): OrderItem {
    const product = this.catalog.getProduct(input.productId);
    if (!product) throw new BadRequestException(`Unknown product ${input.productId}`);

    const modifiers = (input.modifierOptionIds ?? []).map((optionId) => {
      const opt = this.catalog.findModifierOption(input.productId, optionId);
      if (!opt) throw new BadRequestException(`Unknown modifier ${optionId}`);
      return { groupId: opt.groupId, optionId, name: opt.name, priceDeltaPaise: opt.priceDeltaPaise };
    });

    const unitPricePaise =
      product.basePricePaise + modifiers.reduce((sum, m) => sum + m.priceDeltaPaise, 0);

    return {
      id: randomUUID(),
      productId: product.id,
      name: product.name,
      quantity: input.quantity,
      unitPricePaise,
      modifiers,
      status: 'PENDING',
    };
  }

  /**
   * GST split. Default place-of-supply is intra-state → CGST + SGST (rate/2 each);
   * inter-state would use IGST. Tax is computed per line on its rate, then summed.
   */
  private computeTotals(items: OrderItem[], _storeId: string): OrderTotals {
    let subtotalPaise = 0;
    let cgstPaise = 0;
    let sgstPaise = 0;
    for (const item of items) {
      const product = this.catalog.getProduct(item.productId)!;
      const lineTaxable = item.unitPricePaise * item.quantity;
      const lineGst = Math.round((lineTaxable * product.gst.ratePercent) / 100);
      subtotalPaise += lineTaxable;
      cgstPaise += Math.round(lineGst / 2);
      sgstPaise += lineGst - Math.round(lineGst / 2);
    }
    return {
      subtotalPaise,
      cgstPaise,
      sgstPaise,
      igstPaise: 0,
      discountPaise: 0,
      grandTotalPaise: subtotalPaise + cgstPaise + sgstPaise,
    };
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
