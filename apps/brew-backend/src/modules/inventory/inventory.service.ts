import { Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DomainEvents } from '@brew/contracts';
import { EventBus } from '../../common/events/event-bus';

interface StockLevel {
  ingredientId: string;
  onHand: number;
  par: number;
}

/** Inventory & Procurement — recipe/BOM-driven deduction, POs, transfers, wastage. */
@Injectable()
export class InventoryService implements OnModuleInit {
  private readonly stock = new Map<string, StockLevel[]>(); // storeId -> levels

  constructor(private readonly events: EventBus) {}

  onModuleInit(): void {
    // Selling a product deducts ingredient stock per its recipe.
    this.events.subscribe(DomainEvents.OrderPlaced, async (evt) => {
      await this.deductForOrder(evt.storeId, (evt.data as { orderId: string }).orderId);
    });
  }

  private async deductForOrder(storeId: string, orderId: string): Promise<void> {
    // MOCK: in a full build, fetch the order, expand recipes, decrement on-hand.
    await this.events.publish({
      name: DomainEvents.InventoryDeducted,
      storeId,
      occurredAt: new Date().toISOString(),
      eventId: randomUUID(),
      data: { orderId },
    });
  }

  getStoreInventory(storeId: string): StockLevel[] {
    return this.stock.get(storeId) ?? [];
  }

  logWastage(_storeId: string, _ingredientId: string, _quantity: number, _reason: string): void {
    // MOCK: append a wastage entry; feeds loss reporting.
  }
}
