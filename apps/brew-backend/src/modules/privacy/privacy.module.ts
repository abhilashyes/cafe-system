import { Module } from '@nestjs/common';
import { OrderingModule } from '../ordering/ordering.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { PrivacyController } from './privacy.controller';
import { PrivacyService } from './privacy.service';

@Module({
  imports: [OrderingModule, LoyaltyModule],
  controllers: [PrivacyController],
  providers: [PrivacyService],
  exports: [PrivacyService],
})
export class PrivacyModule {}
