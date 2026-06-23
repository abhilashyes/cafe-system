import type { KdsTicket, MenuItem, Order, OrderItem, StationType } from '@brew/contracts';
import { STORE_ID } from './api';

/** Demo mode: fully client-side, no backend (used for the GitHub Pages demo). */
export const demoMode = import.meta.env.VITE_DEMO === 'true';

const MENU: MenuItem[] = [
  {
    id: 'prod_latte', sku: 'BEV-LAT', name: 'Caffè Latte', category: 'Hot Coffee',
    station: 'BAR', basePricePaise: 25000, gst: { hsnSac: '2106', ratePercent: 5 },
    modifierGroups: [], recipe: [], available: true, pricePaise: 25000,
  },
  {
    id: 'prod_croissant', sku: 'BAK-CRO', name: 'Butter Croissant', category: 'Bakery',
    station: 'BAKERY', basePricePaise: 18000, gst: { hsnSac: '1905', ratePercent: 5 },
    modifierGroups: [], recipe: [], available: true, pricePaise: 18000,
  },
];

const stationOf = (productId: string): StationType =>
  MENU.find((m) => m.id === productId)?.station ?? 'BAR';

type Listener = () => void;

/** In-memory POS/KDS state with a tiny pub/sub, mirroring the live API surface. */
class DemoBackend {
  private tickets: KdsTicket[] = [];
  private readonly listeners = new Set<Listener>();

  menu(): MenuItem[] {
    return MENU;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getTickets(): KdsTicket[] {
    return this.tickets;
  }

  placeOrder(
    cart: Array<{ productId: string; name: string; pricePaise: number; quantity: number }>,
    fulfilment: 'DINE_IN' | 'TAKEAWAY',
    tableNumber?: string,
  ): Order {
    const id = crypto.randomUUID();
    const pickupCode = id.slice(0, 4).toUpperCase();
    const subtotal = cart.reduce((s, l) => s + l.pricePaise * l.quantity, 0);
    const gst = Math.round(subtotal * 0.05);
    const cgst = Math.round(gst / 2);

    const items: OrderItem[] = cart.map((l) => ({
      id: crypto.randomUUID(),
      productId: l.productId,
      name: l.name,
      quantity: l.quantity,
      unitPricePaise: l.pricePaise,
      modifiers: [],
      status: 'PENDING',
    }));

    this.tickets = [
      {
        orderId: id,
        storeId: STORE_ID,
        pickupCode,
        fulfilment,
        tableNumber,
        createdAt: new Date().toISOString(),
        items: cart.map((l, i) => ({
          itemId: items[i].id,
          productId: l.productId,
          name: l.name,
          quantity: l.quantity,
          station: stationOf(l.productId),
          modifiers: [],
          status: 'PENDING' as const,
        })),
      },
      ...this.tickets,
    ];
    this.notify();

    return {
      id,
      storeId: STORE_ID,
      channel: 'WALK_IN',
      fulfilment,
      tableNumber,
      pickupCode,
      status: 'RECEIVED',
      items,
      totals: {
        subtotalPaise: subtotal,
        cgstPaise: cgst,
        sgstPaise: gst - cgst,
        igstPaise: 0,
        discountPaise: 0,
        grandTotalPaise: subtotal + gst,
      },
      createdAt: new Date().toISOString(),
    };
  }

  bump(itemId: string): void {
    this.tickets = this.tickets.map((t) => ({
      ...t,
      items: t.items.map((i) => (i.itemId === itemId ? { ...i, status: 'READY' as const } : i)),
    }));
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

export const demo = new DemoBackend();
