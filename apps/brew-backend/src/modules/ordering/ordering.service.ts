import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DomainEvents, type Order, type OrderItem, type OrderTotals } from '@brew/contracts';
import { EventBus } from '../../common/events/event-bus';
import { CatalogService } from '../catalog/catalog.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { OrderRepository } from './order.repository';

export interface CreateOrderInput {
  storeId: string;
  channel: Order['channel'];
  fulfilment: Order['fulfilment'];
  tableNumber?: string;
  scheduledFor?: string;
  customerId?: string;
  customerName?: string;
  rewardId?: string;
  items: Array<{ productId: string; quantity: number; modifierOptionIds?: string[] }>;
}

/**
 * Ordering domain (extraction-ready). Owns the order lifecycle, prices items via
 * Catalog (internal interface), computes GST, and publishes OrderPlaced so
 * Payments, Inventory, KOT, Loyalty and Reporting can react. Orders are persisted
 * via OrderRepository (in-memory in demo, Postgres in live).
 */
@Injectable()
export class OrderingService {
  constructor(
    private readonly events: EventBus,
    private readonly catalog: CatalogService,
    private readonly loyalty: LoyaltyService,
    private readonly repo: OrderRepository,
  ) {}

  async create(input: CreateOrderInput): Promise<Order> {
    if (input.items.length === 0) throw new BadRequestException('Order has no items');
    const id = randomUUID();
    const items = input.items.map((it) => this.priceItem(input.storeId, it));
    const totals = this.computeTotals(items, input.storeId);

    // Redeem a loyalty reward at checkout → discount applied to the grand total.
    if (input.rewardId) {
      if (!input.customerId) throw new BadRequestException('rewardId requires customerId');
      const { discountPaise } = await this.loyalty.redeem(input.customerId, input.rewardId, id);
      totals.discountPaise = Math.min(discountPaise, totals.grandTotalPaise);
      totals.grandTotalPaise -= totals.discountPaise;
    }

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
    await this.repo.save(order);

    await this.events.publish({
      name: DomainEvents.OrderPlaced,
      storeId: order.storeId,
      occurredAt: order.createdAt,
      eventId: randomUUID(),
      data: {
        orderId: id,
        customerId: order.customerId,
        channel: order.channel,
        items: order.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          // Taxable (ex-GST) revenue for this line — used by item profitability.
          lineRevenuePaise: i.unitPricePaise * i.quantity,
        })),
        grandTotalPaise: totals.grandTotalPaise,
      },
    });
    return order;
  }

  /** Price a single line: base + modifier deltas, resolved against Catalog. */
  private priceItem(
    storeId: string,
    input: { productId: string; quantity: number; modifierOptionIds?: string[] },
  ): OrderItem {
    const product = this.catalog.getProduct(input.productId);
    if (!product) throw new BadRequestException(`Unknown product ${input.productId}`);
    // Block ordering of 86'd / unavailable items at this store.
    if (!this.catalog.isAvailable(storeId, input.productId)) {
      throw new ConflictException(`${product.name} is unavailable at this store`);
    }

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

  get(id: string): Promise<Order | undefined> {
    return this.repo.get(id);
  }

  /** All orders for a customer (used by the Privacy data-export flow). */
  listByCustomer(customerId: string): Promise<Order[]> {
    return this.repo.listByCustomer(customerId);
  }

  /**
   * DPDP erasure: pseudonymize the customer on their orders. Financial figures
   * (amounts, GST) are retained per tax law; the identity is scrubbed.
   */
  anonymizeCustomer(customerId: string): Promise<number> {
    return this.repo.anonymizeCustomer(customerId);
  }

  async markReady(id: string): Promise<Order | undefined> {
    const order = await this.repo.get(id);
    if (!order) return undefined;
    order.status = 'READY';
    order.items.forEach((i) => (i.status = 'READY'));
    await this.repo.save(order);
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
