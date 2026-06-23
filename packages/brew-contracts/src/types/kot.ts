import type { Id, StationType } from './hierarchy';
import type { FulfilmentType } from './ordering';

/** Payload for one printed KOT sticker (one per item; stickers stack per order). */
export interface KotStickerPayload {
  orderId: Id;
  pickupCode: string;
  storeId: Id;
  station: StationType;
  itemName: string;
  size?: string;
  modifiers: string[];
  customerNameOrInitial?: string;
  fulfilment: FulfilmentType;
  tableNumber?: string;
  /** e.g. { index: 2, total: 4 } → "Item 2 of 4". */
  sequence: { index: number; total: number };
  timestamp: string;
  /** Optional QR/barcode value for bump-scanning. */
  barcode?: string;
}

/** A live KDS ticket item (one per order line). */
export interface KdsTicketItem {
  itemId: Id;
  productId: Id;
  name: string;
  quantity: number;
  station: StationType;
  modifiers: string[];
  status: 'PENDING' | 'READY';
}

/** A live KDS ticket (one per order) shown on the kitchen/bar display. */
export interface KdsTicket {
  orderId: Id;
  storeId: Id;
  pickupCode: string;
  fulfilment: FulfilmentType;
  tableNumber?: string;
  customerName?: string;
  createdAt: string;
  items: KdsTicketItem[];
}

export type PrinterProtocol = 'ESC_POS' | 'ZPL';

export interface PrinterDevice {
  id: Id;
  storeId: Id;
  name: string;
  protocol: PrinterProtocol;
  /** Logical label media, e.g. "cup-40x30", "food-58x40". */
  labelTemplate: string;
}

export interface PrintJob {
  id: Id;
  deviceId: Id;
  payload: KotStickerPayload;
  status: 'QUEUED' | 'PRINTED' | 'FAILED';
  attempts: number;
  createdAt: string;
}
