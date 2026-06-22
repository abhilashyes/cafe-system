import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { OrderingModule } from '../ordering/ordering.module';
import { KotController } from './kot.controller';
import { KotService } from './kot.service';
import { KdsGateway } from './kds.gateway';

@Module({
  imports: [CatalogModule, OrderingModule],
  controllers: [KotController],
  providers: [KotService, KdsGateway],
  exports: [KotService],
})
export class KotModule {}
