import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Per-store ingredient stock persistence. In-memory (demo) | Postgres (live). */
export abstract class StockRepository {
  abstract listForStore(storeId: string): Promise<Array<{ ingredientId: string; onHand: number }>>;
  abstract set(storeId: string, ingredientId: string, onHand: number): Promise<void>;
}

@Injectable()
export class InMemoryStockRepository extends StockRepository {
  private readonly stock = new Map<string, Map<string, number>>();

  async listForStore(storeId: string): Promise<Array<{ ingredientId: string; onHand: number }>> {
    const m = this.stock.get(storeId);
    return m ? [...m.entries()].map(([ingredientId, onHand]) => ({ ingredientId, onHand })) : [];
  }

  async set(storeId: string, ingredientId: string, onHand: number): Promise<void> {
    let m = this.stock.get(storeId);
    if (!m) {
      m = new Map();
      this.stock.set(storeId, m);
    }
    m.set(ingredientId, onHand);
  }
}

@Injectable()
export class PrismaStockRepository extends StockRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listForStore(storeId: string): Promise<Array<{ ingredientId: string; onHand: number }>> {
    const rows = await this.prisma.stockLevel.findMany({ where: { storeId } });
    return rows.map((r) => ({ ingredientId: r.ingredientId, onHand: r.onHand }));
  }

  async set(storeId: string, ingredientId: string, onHand: number): Promise<void> {
    await this.prisma.stockLevel.upsert({
      where: { storeId_ingredientId: { storeId, ingredientId } },
      create: { storeId, ingredientId, onHand },
      update: { onHand },
    });
  }
}
