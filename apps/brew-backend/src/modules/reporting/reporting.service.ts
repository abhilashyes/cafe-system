import { Injectable } from '@nestjs/common';

/**
 * Reporting & Analytics — sales, profit (revenue − COGS from BOM), unit economics,
 * item profitability. Reads denormalized data; figures must reconcile to settlement.
 */
@Injectable()
export class ReportingService {
  salesReport(scopeLevel: string, scopeId: string, from?: string, to?: string) {
    // MOCK shape; a full build queries the analytics store / read models.
    return {
      scope: { level: scopeLevel, id: scopeId },
      period: { from, to },
      revenuePaise: 0,
      orders: 0,
      byChannel: { MOBILE_PREORDER: 0, WALK_IN: 0 },
      byPaymentMethod: { UPI: 0, CARD: 0, CASH: 0 },
    };
  }

  itemProfitability() {
    return {
      mostProfitable: [],
      dragItems: [],
      insight: 'No data yet — wire COGS from recipe BOM × ingredient cost.',
    };
  }

  unitEconomics() {
    return { averageOrderValuePaise: 0, itemsPerOrder: 0, contributionMarginPercent: 0 };
  }
}
