import { BadRequestException, HttpException, HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  DomainEvents,
  type LoyaltyAccount,
  type LoyaltyLedgerEntry,
  type MembershipTier,
  type Reward,
} from '@brew/contracts';
import { EventBus } from '../../common/events/event-bus';

/** Loyalty — redeemable "stars" ledger + 5 spend-based tiers. */
@Injectable()
export class LoyaltyService implements OnModuleInit {
  private readonly tiers: MembershipTier[] = [
    { id: 't1', name: 'Welcome', rank: 1, qualifyingThreshold: 0, accrualMultiplier: 1, benefits: [] },
    { id: 't2', name: 'Green', rank: 2, qualifyingThreshold: 500000, accrualMultiplier: 1.25, benefits: ['Birthday treat'] },
    { id: 't3', name: 'Gold', rank: 3, qualifyingThreshold: 1500000, accrualMultiplier: 1.5, benefits: ['Free refills'] },
    { id: 't4', name: 'Platinum', rank: 4, qualifyingThreshold: 4000000, accrualMultiplier: 1.75, benefits: ['Priority pickup'] },
    { id: 't5', name: 'Black', rank: 5, qualifyingThreshold: 10000000, accrualMultiplier: 2, benefits: ['Concierge'] },
  ];
  private readonly rewards: Reward[] = [
    { id: 'rw_free_coffee', name: 'Free brewed coffee', costStars: 150, discountPaise: 15000, active: true },
    { id: 'rw_free_pastry', name: 'Free pastry', costStars: 200, discountPaise: 18000, active: true },
  ];
  private readonly accounts = new Map<string, LoyaltyAccount>();
  private readonly ledger: LoyaltyLedgerEntry[] = [];
  /** orderId → customerId, learned from OrderPlaced so capture can accrue. */
  private readonly orderCustomer = new Map<string, string>();

  constructor(private readonly events: EventBus) {}

  onModuleInit(): void {
    // Learn which customer an order belongs to (Loyalty stays decoupled from Ordering).
    this.events.subscribe(DomainEvents.OrderPlaced, (evt) => {
      const data = evt.data as { orderId: string; customerId?: string };
      if (data.customerId) this.orderCustomer.set(data.orderId, data.customerId);
    });

    // Accrue stars on captured payment (the spend-based earn rule).
    this.events.subscribe(DomainEvents.PaymentCaptured, async (evt) => {
      const data = evt.data as { orderId: string; amountPaise?: number };
      const customerId = this.orderCustomer.get(data.orderId);
      if (!customerId) return; // guest checkout — nothing to accrue
      await this.accrue(customerId, data.amountPaise ?? 0, data.orderId, evt.storeId);
    });
  }

  private async accrue(customerId: string, amountPaise: number, orderId: string, storeId: string) {
    const account = this.getOrCreate(customerId);
    const tier = this.tiers.find((t) => t.id === account.tierId)!;
    // Earn rate: 1 star per ₹10, times tier multiplier.
    const stars = Math.floor((amountPaise / 1000) * tier.accrualMultiplier);
    account.balanceStars += stars;
    account.qualifyingSpend += amountPaise;
    account.tierId = this.resolveTier(account.qualifyingSpend).id;
    this.ledger.push({
      id: randomUUID(),
      customerId,
      type: 'ACCRUAL',
      stars,
      orderId,
      createdAt: new Date().toISOString(),
    });
    await this.events.publish({
      name: DomainEvents.LoyaltyAccrued,
      storeId,
      occurredAt: new Date().toISOString(),
      eventId: randomUUID(),
      data: { customerId, stars, orderId },
    });
  }

  getAccount(customerId: string): LoyaltyAccount {
    return this.getOrCreate(customerId);
  }

  getLedger(customerId: string): LoyaltyLedgerEntry[] {
    return this.ledger.filter((e) => e.customerId === customerId);
  }

  listTiers(): MembershipTier[] {
    return this.tiers;
  }

  listRewards(): Reward[] {
    return this.rewards.filter((r) => r.active);
  }

  /**
   * Redeem a reward: deducts stars (REDEMPTION ledger entry) and returns the
   * discount to apply to the order. Throws 402 if the balance is insufficient.
   */
  redeem(customerId: string, rewardId: string, orderId?: string): { discountPaise: number } {
    const reward = this.rewards.find((r) => r.id === rewardId && r.active);
    if (!reward) throw new BadRequestException('Unknown reward');
    const account = this.getOrCreate(customerId);
    if (account.balanceStars < reward.costStars) {
      throw new HttpException('Insufficient stars', HttpStatus.PAYMENT_REQUIRED);
    }
    account.balanceStars -= reward.costStars;
    this.ledger.push({
      id: randomUUID(),
      customerId,
      type: 'REDEMPTION',
      stars: -reward.costStars,
      orderId,
      rewardId,
      createdAt: new Date().toISOString(),
    });
    return { discountPaise: reward.discountPaise };
  }

  private getOrCreate(customerId: string): LoyaltyAccount {
    let acct = this.accounts.get(customerId);
    if (!acct) {
      acct = { customerId, tierId: 't1', balanceStars: 0, qualifyingSpend: 0 };
      this.accounts.set(customerId, acct);
    }
    return acct;
  }

  private resolveTier(qualifyingSpend: number): MembershipTier {
    return [...this.tiers].reverse().find((t) => qualifyingSpend >= t.qualifyingThreshold) ?? this.tiers[0];
  }
}
