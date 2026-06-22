/**
 * Org → Region → Store → Station tenancy hierarchy.
 * All transactional data is scoped to a store; reporting rolls up the hierarchy.
 */

export type Id = string;

export interface Organization {
  id: Id;
  name: string;
  /** GST registration is per-state, but the org owns the legal entity. */
  legalName: string;
}

export interface Region {
  id: Id;
  orgId: Id;
  name: string;
  /** Indian state(s) covered — drives GST place-of-supply. */
  states: string[];
}

export type StationType = 'BAR' | 'HOT_KITCHEN' | 'COLD' | 'BAKERY';

export interface Station {
  id: Id;
  storeId: Id;
  type: StationType;
  displayName: string;
  /** Printer device id this station's KOT stickers route to. */
  printerDeviceId?: Id;
}

export interface Store {
  id: Id;
  regionId: Id;
  name: string;
  /** GSTIN for this store's place of supply. */
  gstin: string;
  address: Address;
  timezone: 'Asia/Kolkata';
  currency: 'INR';
  isOpen: boolean;
  stations: Station[];
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  geo?: { lat: number; lng: number };
}
