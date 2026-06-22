import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { MenuItem, Product } from '@brew/contracts';
import { DomainEvents } from '@brew/contracts';
import { EventBus } from '../../common/events/event-bus';

/** Catalog/Menu — products, modifiers, recipes (BOM), GST/HSN, store availability. */
@Injectable()
export class CatalogService implements OnModuleInit {
  private readonly logger = new Logger(CatalogService.name);
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

  /** storeId → productId → { available, pricePaiseOverride }. */
  private readonly overrides = new Map<string, Map<string, { available: boolean; pricePaise?: number }>>();

  constructor(private readonly events: EventBus) {}

  onModuleInit(): void {
    // When an ingredient runs out, 86 every product whose recipe needs it.
    this.events.subscribe(DomainEvents.InventoryOutOfStock, (evt) => {
      const { ingredientId } = evt.data as { ingredientId: string };
      for (const product of this.products) {
        if (product.recipe.some((line) => line.ingredientId === ingredientId)) {
          this.setAvailability(evt.storeId, product.id, false);
          this.logger.warn(`86'd ${product.name} at ${evt.storeId} (out of ${ingredientId})`);
        }
      }
    });
  }

  /** Store-aware menu with availability + price resolved per store. */
  getStoreMenu(storeId: string): MenuItem[] {
    return this.products.map((p) => ({
      ...p,
      available: this.isAvailable(storeId, p.id),
      pricePaise: this.storeOverride(storeId, p.id)?.pricePaise ?? p.basePricePaise,
    }));
  }

  getProduct(productId: string): Product | undefined {
    return this.products.find((p) => p.id === productId);
  }

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

  isAvailable(storeId: string, productId: string): boolean {
    return this.storeOverride(storeId, productId)?.available ?? true;
  }

  setAvailability(storeId: string, productId: string, available: boolean): void {
    let store = this.overrides.get(storeId);
    if (!store) {
      store = new Map();
      this.overrides.set(storeId, store);
    }
    store.set(productId, { ...store.get(productId), available });
  }

  private storeOverride(storeId: string, productId: string) {
    return this.overrides.get(storeId)?.get(productId);
  }
}
