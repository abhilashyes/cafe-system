import type { Id } from './hierarchy';

/** An ingredient in the inventory/procurement domain (cost carried for COGS). */
export interface Ingredient {
  id: Id;
  name: string;
  /** Base unit recipes are expressed in, e.g. "g", "ml", "unit". */
  unit: string;
  /** Cost per base unit, in paise — drives COGS and profit. */
  costPerUnitPaise: number;
}

/** Per-store on-hand level for an ingredient. */
export interface StockLevel {
  ingredientId: Id;
  name: string;
  unit: string;
  onHand: number;
  /** Par/reorder level — at or below triggers low-stock. */
  par: number;
}
