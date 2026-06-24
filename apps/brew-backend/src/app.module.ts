import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthController } from './health.controller';
import { IdentityModule } from './modules/identity/identity.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { OrderingModule } from './modules/ordering/ordering.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { KotModule } from './modules/kot/kot.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { InvoicingModule } from './modules/invoicing/invoicing.module';
import { ProcurementModule } from './modules/procurement/procurement.module';

/**
 * Modular monolith root. Each module owns its schema/namespace and communicates
 * via the EventBus + published contracts so it can be extracted into its own
 * service later (deployment change, not redesign).
 */
@Module({
  imports: [
    CommonModule,
    PrismaModule,
    IdentityModule,
    CatalogModule,
    OrderingModule,
    PaymentsModule,
    InventoryModule,
    LoyaltyModule,
    KotModule,
    ReportingModule,
    NotificationsModule,
    PrivacyModule,
    InvoicingModule,
    ProcurementModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
