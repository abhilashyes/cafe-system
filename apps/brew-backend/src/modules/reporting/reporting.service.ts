import { Injectable, OnModuleInit } from '@nestjs/common';
import { DomainEvents } from '@brew/contracts';
import { EventBus } from '../../common/events/event-bus';

interface StoreTotals {
  grossRevenuePaise: number; // incl. GST — ties to settlement
  netRevenuePaise: number; // ex-GST — for margin
  cogsPaise: number;
  orders: number;
  byChannel: Record<string, number>;
}

interface ProductTotals {
  productId: string;
  units: number;
  revenuePaise: number; // ex-GST
  cogsPaise: number;
}

interface OrderLine {
  productId: string;
  quantity: number;
  lineRevenuePaise: number;
}

/**
 * Reporting & Analytics — builds read models from domain events. Revenue is
 * recognised only on captured payment (reconciles to settlement); profit =
 * net (ex-GST) revenue − COGS (from recipe BOM × ingredient cost).
 */
@Injectable()
export class ReportingService implements OnModuleInit {
  private readonly perStore = new Map<string, StoreTotals>();
  private readonly perProduct = new Map<string, ProductTotals>();

  // Buffered until the matching payment is captured.
  private readonly pendingItems = new Map<string, { storeId: string; channel: string; items: OrderLine[] }>();
  private readonly pendingCogs = new Map<string, { total: number; perProduct: Map<string, number> }>();

  constructor(private readonly events: EventBus) {}

  onModuleInit(): void {
    this.events.subscribe(DomainEvents.OrderPlaced, (evt) => {
      const data = evt.data as { orderId: string; channel: string; items: OrderLine[] };
      this.pendingItems.set(data.orderId, { storeId: evt.storeId, channel: data.channel, items: data.items });
      const totals = this.store(evt.storeId);
      totals.orders += 1;
      totals.byChannel[data.channel] = (totals.byChannel[data.channel] ?? 0) + 1;
    });

    this.events.subscribe(DomainEvents.InventoryDeducted, (evt) => {
      const data = evt.data as { orderId: string; cogsPaise: number; perProduct: Array<{ productId: string; cogsPaise: number }> };
      this.pendingCogs.set(data.orderId, {
        total: data.cogsPaise,
        perProduct: new Map(data.perProduct.map((p) => [p.productId, p.cogsPaise])),
      });
    });

    // Recognise revenue + fold COGS into per-store/per-product models on capture.
    this.events.subscribe(DomainEvents.PaymentCaptured, (evt) => {
      const data = evt.data as { orderId: string; amountPaise?: number };
      const order = this.pendingItems.get(data.orderId);
      if (!order) return;
      const cogs = this.pendingCogs.get(data.orderId);
      const store = this.store(order.storeId);

      store.grossRevenuePaise += data.amountPaise ?? 0;
      store.cogsPaise += cogs?.total ?? 0;
      for (const line of order.items) {
        store.netRevenuePaise += line.lineRevenuePaise;
        const pt = this.product(line.productId);
        pt.units += line.quantity;
        pt.revenuePaise += line.lineRevenuePaise;
        pt.cogsPaise += cogs?.perProduct.get(line.productId) ?? 0;
      }
      this.pendingItems.delete(data.orderId);
      this.pendingCogs.delete(data.orderId);
    });
  }

  private store(storeId: string): StoreTotals {
    let totals = this.perStore.get(storeId);
    if (!totals) {
      totals = { grossRevenuePaise: 0, netRevenuePaise: 0, cogsPaise: 0, orders: 0, byChannel: {} };
      this.perStore.set(storeId, totals);
    }
    return totals;
  }

  private product(productId: string): ProductTotals {
    let pt = this.perProduct.get(productId);
    if (!pt) {
      pt = { productId, units: 0, revenuePaise: 0, cogsPaise: 0 };
      this.perProduct.set(productId, pt);
    }
    return pt;
  }

  salesReport(scopeLevel: string, scopeId: string, from?: string, to?: string) {
    const stores =
      scopeLevel === 'STORE' && scopeId
        ? [this.store(scopeId)]
        : [...this.perStore.values()];
    const grossRevenuePaise = stores.reduce((s, t) => s + t.grossRevenuePaise, 0);
    const netRevenuePaise = stores.reduce((s, t) => s + t.netRevenuePaise, 0);
    const cogsPaise = stores.reduce((s, t) => s + t.cogsPaise, 0);
    const orders = stores.reduce((s, t) => s + t.orders, 0);
    const byChannel: Record<string, number> = {};
    for (const t of stores) {
      for (const [k, v] of Object.entries(t.byChannel)) byChannel[k] = (byChannel[k] ?? 0) + v;
    }
    const grossProfitPaise = netRevenuePaise - cogsPaise;
    return {
      scope: { level: scopeLevel, id: scopeId },
      period: { from, to },
      revenuePaise: grossRevenuePaise,
      orders,
      averageOrderValuePaise: orders ? Math.round(grossRevenuePaise / orders) : 0,
      cogsPaise,
      grossProfitPaise,
      grossMarginPercent: netRevenuePaise ? round1((grossProfitPaise / netRevenuePaise) * 100) : 0,
      byChannel,
    };
  }

  /** Rank items by margin & volume; flag drag and hidden-gem items (§7). */
  itemProfitability() {
    const items = [...this.perProduct.values()].map((p) => {
      const profit = p.revenuePaise - p.cogsPaise;
      return {
        productId: p.productId,
        units: p.units,
        revenuePaise: p.revenuePaise,
        cogsPaise: p.cogsPaise,
        profitPaise: profit,
        marginPercent: p.revenuePaise ? round1((profit / p.revenuePaise) * 100) : 0,
      };
    });
    if (items.length === 0) {
      return { mostProfitable: [], dragItems: [], insights: ['No captured sales yet.'] };
    }
    const byProfit = [...items].sort((a, b) => b.profitPaise - a.profitPaise);
    const medianUnits = median(items.map((i) => i.units));
    const medianMargin = median(items.map((i) => i.marginPercent));
    const insights: string[] = [];
    for (const i of items) {
      if (i.units >= medianUnits && i.marginPercent < medianMargin) {
        insights.push(`${i.productId}: high volume but low margin (${i.marginPercent}%) — review pricing or recipe cost.`);
      }
      if (i.units < medianUnits && i.marginPercent >= medianMargin) {
        insights.push(`${i.productId}: low volume but high margin (${i.marginPercent}%) — a hidden gem worth promoting.`);
      }
    }
    return {
      mostProfitable: byProfit.slice(0, 3),
      dragItems: [...byProfit].reverse().slice(0, 3),
      insights: insights.length ? insights : ['Item mix looks balanced.'],
    };
  }

  unitEconomics() {
    const stores = [...this.perStore.values()];
    const grossRevenuePaise = stores.reduce((s, t) => s + t.grossRevenuePaise, 0);
    const netRevenuePaise = stores.reduce((s, t) => s + t.netRevenuePaise, 0);
    const cogsPaise = stores.reduce((s, t) => s + t.cogsPaise, 0);
    const orders = stores.reduce((s, t) => s + t.orders, 0);
    const units = [...this.perProduct.values()].reduce((s, p) => s + p.units, 0);
    return {
      averageOrderValuePaise: orders ? Math.round(grossRevenuePaise / orders) : 0,
      itemsPerOrder: orders ? round1(units / orders) : 0,
      contributionMarginPercent: netRevenuePaise
        ? round1(((netRevenuePaise - cogsPaise) / netRevenuePaise) * 100)
        : 0,
    };
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
