import type { Id } from './hierarchy';

/** Channel-extensible: AGGREGATOR reserved for future Swiggy/Zomato, out of scope at launch. */
export type OrderChannel = 'MOBILE_PREORDER' | 'WALK_IN' | 'AGGREGATOR';

export type FulfilmentType = 'DINE_IN' | 'TAKEAWAY';

export type OrderStatus =
  | 'CART'
  | 'RECEIVED'
  | 'IN_PROGRESS'
  | 'READY'
  | 'PICKED_UP'
  | 'CANCELLED';

export interface OrderItemModifier {
  groupId: Id;
  optionId: Id;
  name: string;
  priceDeltaPaise: number;
}

export interface OrderItem {
  id: Id;
  productId: Id;
  name: string;
  quantity: number;
  unitPricePaise: number;
  modifiers: OrderItemModifier[];
  /** Per-item fulfilment status used by KDS/KOT. */
  status: 'PENDING' | 'IN_PROGRESS' | 'READY';
}

export interface Order {
  id: Id;
  storeId: Id;
  channel: OrderChannel;
  fulfilment: FulfilmentType;
  /** Optional table number for dine-in; flows to KOT and receipt. */
  tableNumber?: string;
  customerId?: Id;
  customerName?: string;
  /** Short human-friendly pickup code printed on stickers/receipt. */
  pickupCode: string;
  status: OrderStatus;
  items: OrderItem[];
  /** ISO timestamp; for scheduled pre-orders this is the requested ready time. */
  scheduledFor?: string;
  totals: OrderTotals;
  createdAt: string;
}

export interface OrderTotals {
  subtotalPaise: number;
  /** GST split for the place of supply. */
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  discountPaise: number;
  grandTotalPaise: number;
}
