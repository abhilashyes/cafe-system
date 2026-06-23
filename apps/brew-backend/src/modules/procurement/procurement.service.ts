import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InventoryService } from '../inventory/inventory.service';

export interface Supplier {
  id: string;
  name: string;
  ingredientIds: string[];
}

export interface PoLine {
  ingredientId: string;
  quantity: number;
}

export type PoStatus = 'DRAFT' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  storeId: string;
  lines: PoLine[];
  status: PoStatus;
  createdAt: string;
}

/**
 * Procurement (§8): suppliers, purchase orders with an approval workflow, goods
 * receiving (increments store inventory), and inter-store transfers. Central
 * config (suppliers/par) is head-office; stores raise/receive within permissions.
 */
@Injectable()
export class ProcurementService {
  private readonly suppliers: Supplier[] = [
    { id: 'sup_beans', name: 'Western Ghats Coffee Co.', ingredientIds: ['ing_espresso'] },
    { id: 'sup_dairy', name: 'Amul Dairy', ingredientIds: ['ing_milk'] },
    { id: 'sup_bakery', name: 'Theobroma Wholesale', ingredientIds: ['ing_croissant'] },
  ];
  private readonly pos = new Map<string, PurchaseOrder>();

  constructor(private readonly inventory: InventoryService) {}

  listSuppliers(): Supplier[] {
    return this.suppliers;
  }

  listPurchaseOrders(): PurchaseOrder[] {
    return [...this.pos.values()];
  }

  createPurchaseOrder(input: { supplierId: string; storeId: string; lines: PoLine[] }): PurchaseOrder {
    if (!this.suppliers.some((s) => s.id === input.supplierId)) {
      throw new BadRequestException('Unknown supplier');
    }
    if (!input.lines?.length) throw new BadRequestException('PO has no lines');
    const po: PurchaseOrder = {
      id: randomUUID(),
      supplierId: input.supplierId,
      storeId: input.storeId,
      lines: input.lines,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };
    this.pos.set(po.id, po);
    return po;
  }

  approve(poId: string): PurchaseOrder {
    const po = this.require(poId);
    if (po.status !== 'DRAFT') throw new BadRequestException(`Cannot approve a ${po.status} PO`);
    po.status = 'APPROVED';
    return po;
  }

  /** Receive an approved PO with discrepancy handling: received quantities may
   *  differ from ordered; what actually arrives is what's added to stock. */
  receive(poId: string, received?: PoLine[]): PurchaseOrder {
    const po = this.require(poId);
    if (po.status !== 'APPROVED') throw new BadRequestException(`Cannot receive a ${po.status} PO`);
    const lines = received?.length ? received : po.lines;
    for (const line of lines) {
      this.inventory.receiveStock(po.storeId, line.ingredientId, line.quantity);
    }
    po.status = 'RECEIVED';
    return po;
  }

  async createTransfer(input: {
    fromStoreId: string;
    toStoreId: string;
    ingredientId: string;
    quantity: number;
  }): Promise<{ ok: true }> {
    await this.inventory.transfer(input.fromStoreId, input.toStoreId, input.ingredientId, input.quantity);
    return { ok: true };
  }

  private require(poId: string): PurchaseOrder {
    const po = this.pos.get(poId);
    if (!po) throw new NotFoundException('Unknown purchase order');
    return po;
  }
}
