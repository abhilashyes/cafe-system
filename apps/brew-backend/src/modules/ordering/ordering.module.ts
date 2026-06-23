import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { OrderingController } from './ordering.controller';
import { OrderingService } from './ordering.service';

@Module({
  imports: [CatalogModule, LoyaltyModule],
  controllers: [OrderingController],
  providers: [OrderingService],
  exports: [OrderingService],
})
export class OrderingModule {}
