import type { Id, StationType } from './hierarchy';

/** GST tax classification carried on every sellable product. */
export interface GstInfo {
  /** HSN (goods) or SAC (services) code. */
  hsnSac: string;
  /** Total GST rate as a percentage, e.g. 5, 12, 18. Split into CGST/SGST or IGST at invoice time. */
  ratePercent: number;
}

export interface ModifierOption {
  id: Id;
  name: string;
  priceDeltaPaise: number;
}

export interface ModifierGroup {
  id: Id;
  name: string; // e.g. "Milk", "Size", "Shots"
  minSelect: number;
  maxSelect: number;
  options: ModifierOption[];
}

export interface RecipeLine {
  ingredientId: Id;
  /** Quantity of the ingredient consumed per unit sold, in the ingredient's base unit. */
  quantity: number;
  unit: string; // e.g. "g", "ml", "unit"
}

export interface Product {
  id: Id;
  sku: string;
  name: string;
  description?: string;
  category: string;
  /** Which station prepares this product — drives KOT routing. */
  station: StationType;
  basePricePaise: number;
  gst: GstInfo;
  modifierGroups: ModifierGroup[];
  /** Bill of materials — enables inventory deduction and COGS. */
  recipe: RecipeLine[];
  allergens?: string[];
  nutrition?: Record<string, number>;
}

/** Store-level availability/pricing overrides (menu varies by store). */
export interface StoreProductOverride {
  storeId: Id;
  productId: Id;
  available: boolean; // false = "86'd"
  pricePaiseOverride?: number;
}
