import { Module } from '@nestjs/common';
import { resolvePersistence } from '../../common/config/profile';
import { CatalogModule } from '../catalog/catalog.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { OrderingController } from './ordering.controller';
import { OrderingService } from './ordering.service';
import { OrderRepository, InMemoryOrderRepository, PrismaOrderRepository } from './order.repository';

const persistence = resolvePersistence();

@Module({
  imports: [CatalogModule, LoyaltyModule],
  controllers: [OrderingController],
  providers: [
    OrderingService,
    {
      provide: OrderRepository,
      useClass: persistence === 'postgres' ? PrismaOrderRepository : InMemoryOrderRepository,
    },
  ],
  exports: [OrderingService],
})
export class OrderingModule {}
