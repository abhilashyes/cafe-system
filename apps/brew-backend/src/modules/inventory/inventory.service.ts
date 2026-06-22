import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DomainEvents, type Ingredient, type StockLevel } from '@brew/contracts';
import { EventBus } from '../../common/events/event-bus';
import { CatalogService } from '../catalog/catalog.service';

/**
 * Inventory & Procurement — recipe/BOM-driven deduction, per-store stock, COGS,
 * wastage. On OrderPlaced it expands each item's recipe (from Catalog), decrements
 * store stock, computes COGS, and publishes InventoryDeducted. When an ingredient
 * is exhausted it publishes InventoryOutOfStock so Catalog can 86 affected products.
 * MOCK persistence: in-memory (Aurora in prod).
 */
@Injectable()
export class InventoryService implements OnModuleInit {
  /** Ingredient master with cost (paise per base unit). */
  private readonly ingredients = new Map<string, Ingredient>([
    ['ing_espresso', { id: 'ing_espresso', name: 'Espresso beans', unit: 'g', costPerUnitPaise: 50 }],
    ['ing_milk', { id: 'ing_milk', name: 'Milk', unit: 'ml', costPerUnitPaise: 6 }],
    ['ing_croissant', { id: 'ing_croissant', name: 'Croissant (raw)', unit: 'unit', costPerUnitPaise: 6000 }],
  ]);

  /** storeId → ingredientId → on-hand quantity. */
  private readonly stock = new Map<string, Map<string, number>>();
  /** Default opening stock + par per ingredient (seeded lazily per store). */
  private readonly opening: Record<string, { onHand: number; par: number }> = {
    ing_espresso: { onHand: 50_000, par: 5_000 },
    ing_milk: { onHand: 40_000, par: 4_000 },
    ing_croissant: { onHand: 200, par: 20 },
  };

  constructor(
    private readonly events: EventBus,
    private readonly catalog: CatalogService,
  ) {}

  onModuleInit(): void {
    // Selling a product deducts ingredient stock per its recipe.
    this.events.subscribe(DomainEvents.OrderPlaced, async (evt) => {
      const data = evt.data as { orderId: string; items: Array<{ productId: string; quantity: number }> };
      await this.deductForOrder(evt.storeId, data.orderId, data.items);
    });
  }

  private storeStock(storeId: string): Map<string, number> {
    let levels = this.stock.get(storeId);
    if (!levels) {
      levels = new Map(Object.entries(this.opening).map(([id, v]) => [id, v.onHand]));
      this.stock.set(storeId, levels);
    }
    return levels;
  }

  private async deductForOrder(
    storeId: string,
    orderId: string,
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<void> {
    const levels = this.storeStock(storeId);
    let cogsPaise = 0;
    const perProduct: Array<{ productId: string; cogsPaise: number }> = [];
    const touched = new Set<string>();

    for (const item of items) {
      const product = this.catalog.getProduct(item.productId);
      let productCogs = 0;
      for (const line of product?.recipe ?? []) {
        const consumed = line.quantity * item.quantity;
        const remaining = (levels.get(line.ingredientId) ?? 0) - consumed;
        levels.set(line.ingredientId, Math.max(0, remaining));
        touched.add(line.ingredientId);
        const cost = this.ingredients.get(line.ingredientId)?.costPerUnitPaise ?? 0;
        productCogs += consumed * cost;
      }
      cogsPaise += productCogs;
      perProduct.push({ productId: item.productId, cogsPaise: productCogs });
    }

    await this.events.publish({
      name: DomainEvents.InventoryDeducted,
      storeId,
      occurredAt: new Date().toISOString(),
      eventId: randomUUID(),
      data: { orderId, cogsPaise, perProduct },
    });

    await this.checkDepletion(storeId, touched);
  }

  /** Emit out-of-stock for any touched ingredient now at/below zero. */
  private async checkDepletion(storeId: string, ingredientIds: Set<string>): Promise<void> {
    const levels = this.storeStock(storeId);
    for (const ingredientId of ingredientIds) {
      if ((levels.get(ingredientId) ?? 0) <= 0) {
        await this.events.publish({
          name: DomainEvents.InventoryOutOfStock,
          storeId,
          occurredAt: new Date().toISOString(),
          eventId: randomUUID(),
          data: { ingredientId },
        });
      }
    }
  }

  getStoreInventory(storeId: string): StockLevel[] {
    const levels = this.storeStock(storeId);
    return [...this.ingredients.values()].map((ing) => ({
      ingredientId: ing.id,
      name: ing.name,
      unit: ing.unit,
      onHand: levels.get(ing.id) ?? 0,
      par: this.opening[ing.id]?.par ?? 0,
    }));
  }

  async logWastage(
    storeId: string,
    ingredientId: string,
    quantity: number,
    _reason: string,
  ): Promise<void> {
    if (!this.ingredients.has(ingredientId)) throw new BadRequestException('Unknown ingredient');
    const levels = this.storeStock(storeId);
    levels.set(ingredientId, Math.max(0, (levels.get(ingredientId) ?? 0) - quantity));
    await this.checkDepletion(storeId, new Set([ingredientId]));
  }
}
