import { Injectable, OnModuleInit } from '@nestjs/common';
import { DomainEvents } from '@brew/contracts';
import { EventBus } from '../../common/events/event-bus';

interface StoreTotals {
  revenuePaise: number;
  orders: number;
  byChannel: Record<string, number>;
}

/**
 * Reporting & Analytics — builds read models from domain events. In a full build
 * these are durable projections; here they are in-memory and must still reconcile
 * to settlement (revenue counts only CAPTURED payments).
 */
@Injectable()
export class ReportingService implements OnModuleInit {
  private readonly perStore = new Map<string, StoreTotals>();
  /** orderId → { storeId, channel } captured at OrderPlaced for payment join. */
  private readonly orderMeta = new Map<string, { storeId: string; channel: string }>();

  constructor(private readonly events: EventBus) {}

  onModuleInit(): void {
    this.events.subscribe(DomainEvents.OrderPlaced, (evt) => {
      const data = evt.data as { orderId: string; channel: string };
      this.orderMeta.set(data.orderId, { storeId: evt.storeId, channel: data.channel });
      const totals = this.store(evt.storeId);
      totals.orders += 1;
      totals.byChannel[data.channel] = (totals.byChannel[data.channel] ?? 0) + 1;
    });

    // Revenue is only recognised on captured payment (reconciles to settlement).
    this.events.subscribe(DomainEvents.PaymentCaptured, (evt) => {
      const data = evt.data as { orderId: string; amountPaise?: number };
      const meta = this.orderMeta.get(data.orderId);
      if (!meta) return;
      this.store(meta.storeId).revenuePaise += data.amountPaise ?? 0;
    });
  }

  private store(storeId: string): StoreTotals {
    let totals = this.perStore.get(storeId);
    if (!totals) {
      totals = { revenuePaise: 0, orders: 0, byChannel: {} };
      this.perStore.set(storeId, totals);
    }
    return totals;
  }

  salesReport(scopeLevel: string, scopeId: string, from?: string, to?: string) {
    // STORE scope returns that store; ORG/REGION sum all known stores (mock rollup).
    const stores =
      scopeLevel === 'STORE' && scopeId
        ? [this.perStore.get(scopeId) ?? this.store(scopeId)]
        : [...this.perStore.values()];
    const revenuePaise = stores.reduce((s, t) => s + t.revenuePaise, 0);
    const orders = stores.reduce((s, t) => s + t.orders, 0);
    const byChannel: Record<string, number> = {};
    for (const t of stores) {
      for (const [k, v] of Object.entries(t.byChannel)) byChannel[k] = (byChannel[k] ?? 0) + v;
    }
    return {
      scope: { level: scopeLevel, id: scopeId },
      period: { from, to },
      revenuePaise,
      orders,
      averageOrderValuePaise: orders ? Math.round(revenuePaise / orders) : 0,
      byChannel,
    };
  }

  itemProfitability() {
    return {
      mostProfitable: [],
      dragItems: [],
      insight: 'No data yet — wire COGS from recipe BOM × ingredient cost.',
    };
  }

  unitEconomics() {
    const stores = [...this.perStore.values()];
    const revenuePaise = stores.reduce((s, t) => s + t.revenuePaise, 0);
    const orders = stores.reduce((s, t) => s + t.orders, 0);
    return {
      averageOrderValuePaise: orders ? Math.round(revenuePaise / orders) : 0,
      itemsPerOrder: 0,
      contributionMarginPercent: 0,
    };
  }
}
