import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DomainEvents, type Ingredient, type StockLevel } from '@brew/contracts';
import { EventBus } from '../../common/events/event-bus';
import { CatalogService } from '../catalog/catalog.service';
import { StockRepository } from './stock.repository';

/**
 * Inventory — recipe/BOM-driven deduction, per-store stock, COGS, wastage. On
 * OrderPlaced it expands each item's recipe (from Catalog), decrements store
 * stock, computes COGS, and publishes InventoryDeducted; an exhausted ingredient
 * publishes InventoryOutOfStock so Catalog can 86 affected products.
 *
 * Stock levels are persisted via StockRepository (in-memory demo, Postgres live).
 * The ingredient master + opening/par are seed/reference data (in-memory).
 */
@Injectable()
export class InventoryService implements OnModuleInit {
  /** Ingredient master with cost (paise per base unit). */
  private readonly ingredients = new Map<string, Ingredient>([
    ['ing_espresso', { id: 'ing_espresso', name: 'Espresso beans', unit: 'g', costPerUnitPaise: 50 }],
    ['ing_milk', { id: 'ing_milk', name: 'Milk', unit: 'ml', costPerUnitPaise: 6 }],
    ['ing_croissant', { id: 'ing_croissant', name: 'Croissant (raw)', unit: 'unit', costPerUnitPaise: 6000 }],
  ]);

  /** Default opening stock + par per ingredient (seeded lazily per store). */
  private readonly opening: Record<string, { onHand: number; par: number }> = {
    ing_espresso: { onHand: 50_000, par: 5_000 },
    ing_milk: { onHand: 40_000, par: 4_000 },
    ing_croissant: { onHand: 200, par: 20 },
  };

  constructor(
    private readonly events: EventBus,
    private readonly catalog: CatalogService,
    private readonly repo: StockRepository,
  ) {}

  onModuleInit(): void {
    this.events.subscribe(DomainEvents.OrderPlaced, async (evt) => {
      const data = evt.data as { orderId: string; items: Array<{ productId: string; quantity: number }> };
      await this.deductForOrder(evt.storeId, data.orderId, data.items);
    });
  }

  /** Current store levels, lazily seeding opening stock for any unseeded ingredient. */
  private async levels(storeId: string): Promise<Map<string, number>> {
    const rows = await this.repo.listForStore(storeId);
    const m = new Map(rows.map((r) => [r.ingredientId, r.onHand]));
    for (const [id, v] of Object.entries(this.opening)) {
      if (!m.has(id)) {
        m.set(id, v.onHand);
        await this.repo.set(storeId, id, v.onHand);
      }
    }
    return m;
  }

  private async deductForOrder(
    storeId: string,
    orderId: string,
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<void> {
    const levels = await this.levels(storeId);
    let cogsPaise = 0;
    const perProduct: Array<{ productId: string; cogsPaise: number }> = [];
    const touched = new Set<string>();

    for (const item of items) {
      const product = this.catalog.getProduct(item.productId);
      let productCogs = 0;
      for (const line of product?.recipe ?? []) {
        const consumed = line.quantity * item.quantity;
        const next = Math.max(0, (levels.get(line.ingredientId) ?? 0) - consumed);
        levels.set(line.ingredientId, next);
        await this.repo.set(storeId, line.ingredientId, next);
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

    await this.emitDepletion(storeId, touched, levels);
  }

  /** Emit out-of-stock for any touched ingredient now at/below zero. */
  private async emitDepletion(storeId: string, ingredientIds: Set<string>, levels: Map<string, number>): Promise<void> {
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

  async getStoreInventory(storeId: string): Promise<StockLevel[]> {
    const levels = await this.levels(storeId);
    return [...this.ingredients.values()].map((ing) => ({
      ingredientId: ing.id,
      name: ing.name,
      unit: ing.unit,
      onHand: levels.get(ing.id) ?? 0,
      par: this.opening[ing.id]?.par ?? 0,
    }));
  }

  async logWastage(storeId: string, ingredientId: string, quantity: number, _reason: string): Promise<void> {
    if (!this.ingredients.has(ingredientId)) throw new BadRequestException('Unknown ingredient');
    const levels = await this.levels(storeId);
    const next = Math.max(0, (levels.get(ingredientId) ?? 0) - quantity);
    levels.set(ingredientId, next);
    await this.repo.set(storeId, ingredientId, next);
    await this.emitDepletion(storeId, new Set([ingredientId]), levels);
  }

  /** Goods receiving (e.g. a PO line arriving) — increments on-hand stock. */
  async receiveStock(storeId: string, ingredientId: string, quantity: number): Promise<void> {
    if (!this.ingredients.has(ingredientId)) throw new BadRequestException('Unknown ingredient');
    if (quantity <= 0) throw new BadRequestException('Quantity must be positive');
    const levels = await this.levels(storeId);
    await this.repo.set(storeId, ingredientId, (levels.get(ingredientId) ?? 0) + quantity);
  }

  /** Inter-store transfer: deduct at source, add at destination. */
  async transfer(fromStoreId: string, toStoreId: string, ingredientId: string, quantity: number): Promise<void> {
    if (!this.ingredients.has(ingredientId)) throw new BadRequestException('Unknown ingredient');
    const source = await this.levels(fromStoreId);
    if ((source.get(ingredientId) ?? 0) < quantity) {
      throw new BadRequestException('Insufficient stock at source store');
    }
    const next = (source.get(ingredientId) ?? 0) - quantity;
    source.set(ingredientId, next);
    await this.repo.set(fromStoreId, ingredientId, next);
    await this.receiveStock(toStoreId, ingredientId, quantity);
    await this.emitDepletion(fromStoreId, new Set([ingredientId]), source);
  }
}
