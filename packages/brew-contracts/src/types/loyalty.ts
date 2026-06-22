import type { Id } from './hierarchy';

/** Five spend-based membership tiers (configurable in global admin). */
export interface MembershipTier {
  id: Id;
  name: string; // e.g. Welcome, Green, Gold, Platinum, Black
  rank: 1 | 2 | 3 | 4 | 5;
  /** Spend (paise) or points required within the rolling qualifying period. */
  qualifyingThreshold: number;
  /** Stars earned per ₹ spent multiplier at this tier. */
  accrualMultiplier: number;
  benefits: string[];
}

export type LedgerEntryType = 'ACCRUAL' | 'REDEMPTION' | 'EXPIRY' | 'ADJUSTMENT';

/** Auditable points ledger — must reconcile to transactions. */
export interface LoyaltyLedgerEntry {
  id: Id;
  customerId: Id;
  type: LedgerEntryType;
  /** Positive for accrual, negative for redemption/expiry. */
  stars: number;
  orderId?: Id;
  rewardId?: Id;
  createdAt: string;
  expiresAt?: string;
}

export interface Reward {
  id: Id;
  name: string;
  costStars: number;
  active: boolean;
}

export interface LoyaltyAccount {
  customerId: Id;
  tierId: Id;
  balanceStars: number;
  /** Spend in the current rolling qualifying period (paise). */
  qualifyingSpend: number;
}
