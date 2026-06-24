import { Injectable } from '@nestjs/common';
import type { LoyaltyAccount, LoyaltyLedgerEntry } from '@brew/contracts';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Persistence port for loyalty. Demo profile → in-memory; live profile → Postgres
 * (via Prisma). Bound by BREW_PROFILE in LoyaltyModule.
 */
export abstract class LoyaltyRepository {
  abstract getAccount(customerId: string): Promise<LoyaltyAccount | undefined>;
  abstract saveAccount(account: LoyaltyAccount): Promise<void>;
  abstract addLedger(entry: LoyaltyLedgerEntry): Promise<void>;
  abstract listLedger(customerId: string): Promise<LoyaltyLedgerEntry[]>;
}

@Injectable()
export class InMemoryLoyaltyRepository extends LoyaltyRepository {
  private readonly accounts = new Map<string, LoyaltyAccount>();
  private readonly ledger: LoyaltyLedgerEntry[] = [];

  async getAccount(customerId: string): Promise<LoyaltyAccount | undefined> {
    const a = this.accounts.get(customerId);
    return a ? { ...a } : undefined;
  }

  async saveAccount(account: LoyaltyAccount): Promise<void> {
    this.accounts.set(account.customerId, { ...account });
  }

  async addLedger(entry: LoyaltyLedgerEntry): Promise<void> {
    this.ledger.push({ ...entry });
  }

  async listLedger(customerId: string): Promise<LoyaltyLedgerEntry[]> {
    return this.ledger.filter((e) => e.customerId === customerId).map((e) => ({ ...e }));
  }
}

@Injectable()
export class PrismaLoyaltyRepository extends LoyaltyRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getAccount(customerId: string): Promise<LoyaltyAccount | undefined> {
    const a = await this.prisma.loyaltyAccount.findUnique({ where: { customerId } });
    return a ?? undefined;
  }

  async saveAccount(account: LoyaltyAccount): Promise<void> {
    await this.prisma.loyaltyAccount.upsert({
      where: { customerId: account.customerId },
      create: account,
      update: {
        tierId: account.tierId,
        balanceStars: account.balanceStars,
        qualifyingSpend: account.qualifyingSpend,
      },
    });
  }

  async addLedger(entry: LoyaltyLedgerEntry): Promise<void> {
    await this.prisma.loyaltyLedgerEntry.create({
      data: {
        id: entry.id,
        customerId: entry.customerId,
        type: entry.type,
        stars: entry.stars,
        orderId: entry.orderId,
        rewardId: entry.rewardId,
        createdAt: new Date(entry.createdAt),
      },
    });
  }

  async listLedger(customerId: string): Promise<LoyaltyLedgerEntry[]> {
    const rows = await this.prisma.loyaltyLedgerEntry.findMany({
      where: { customerId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      customerId: r.customerId,
      type: r.type as LoyaltyLedgerEntry['type'],
      stars: r.stars,
      orderId: r.orderId ?? undefined,
      rewardId: r.rewardId ?? undefined,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
