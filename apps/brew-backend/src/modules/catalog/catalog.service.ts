import { Injectable } from '@nestjs/common';
import type { Product } from '@brew/contracts';

/** Catalog/Menu — products, modifiers, recipes (BOM), GST/HSN, store availability. */
@Injectable()
export class CatalogService {
  private readonly products: Product[] = [
    {
      id: 'prod_latte',
      sku: 'BEV-LAT',
      name: 'Caffè Latte',
      category: 'Hot Coffee',
      station: 'BAR',
      basePricePaise: 25000,
      gst: { hsnSac: '2106', ratePercent: 5 },
      modifierGroups: [],
      recipe: [
        { ingredientId: 'ing_espresso', quantity: 18, unit: 'g' },
        { ingredientId: 'ing_milk', quantity: 200, unit: 'ml' },
      ],
    },
  ];

  /** Store-aware menu (availability/pricing can vary by store). */
  getStoreMenu(_storeId: string): Product[] {
    return this.products;
  }

  setAvailability(_storeId: string, _productId: string, _available: boolean): void {
    // MOCK: persist a StoreProductOverride in a full build (feeds 86 handling).
  }
}
