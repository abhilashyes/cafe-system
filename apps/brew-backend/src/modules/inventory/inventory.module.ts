import { Module } from '@nestjs/common';
import { resolvePersistence } from '../../common/config/profile';
import { CatalogModule } from '../catalog/catalog.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { StockRepository, InMemoryStockRepository, PrismaStockRepository } from './stock.repository';

const persistence = resolvePersistence();

@Module({
  imports: [CatalogModule],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    {
      provide: StockRepository,
      useClass: persistence === 'postgres' ? PrismaStockRepository : InMemoryStockRepository,
    },
  ],
  exports: [InventoryService],
})
export class InventoryModule {}
