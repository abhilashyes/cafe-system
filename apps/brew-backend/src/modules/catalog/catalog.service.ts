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
      modifierGroups: [
        {
          id: 'grp_milk',
          name: 'Milk',
          minSelect: 0,
          maxSelect: 1,
          options: [
            { id: 'opt_oat', name: 'Oat milk', priceDeltaPaise: 4000 },
            { id: 'opt_almond', name: 'Almond milk', priceDeltaPaise: 4000 },
          ],
        },
        {
          id: 'grp_shots',
          name: 'Shots',
          minSelect: 0,
          maxSelect: 2,
          options: [{ id: 'opt_extra_shot', name: 'Extra shot', priceDeltaPaise: 3000 }],
        },
      ],
      recipe: [
        { ingredientId: 'ing_espresso', quantity: 18, unit: 'g' },
        { ingredientId: 'ing_milk', quantity: 200, unit: 'ml' },
      ],
    },
    {
      id: 'prod_croissant',
      sku: 'BAK-CRO',
      name: 'Butter Croissant',
      category: 'Bakery',
      station: 'BAKERY',
      basePricePaise: 18000,
      gst: { hsnSac: '1905', ratePercent: 5 },
      modifierGroups: [],
      recipe: [{ ingredientId: 'ing_croissant', quantity: 1, unit: 'unit' }],
    },
  ];

  /** Store-aware menu (availability/pricing can vary by store). */
  getStoreMenu(_storeId: string): Product[] {
    return this.products;
  }

  /** Look up a single product (used by Ordering to price + route items). */
  getProduct(productId: string): Product | undefined {
    return this.products.find((p) => p.id === productId);
  }

  /** Resolve a modifier option to its name + price delta. */
  findModifierOption(
    productId: string,
    optionId: string,
  ): { groupId: string; name: string; priceDeltaPaise: number } | undefined {
    const product = this.getProduct(productId);
    for (const group of product?.modifierGroups ?? []) {
      const option = group.options.find((o) => o.id === optionId);
      if (option) {
        return { groupId: group.id, name: option.name, priceDeltaPaise: option.priceDeltaPaise };
      }
    }
    return undefined;
  }

  setAvailability(_storeId: string, _productId: string, _available: boolean): void {
    // MOCK: persist a StoreProductOverride in a full build (feeds 86 handling).
  }
}
