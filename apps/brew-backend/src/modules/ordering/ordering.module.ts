import { Module } from '@nestjs/common';
import { OrderingController } from './ordering.controller';
import { OrderingService } from './ordering.service';

@Module({
  controllers: [OrderingController],
  providers: [OrderingService],
  exports: [OrderingService],
})
export class OrderingModule {}
