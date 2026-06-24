import { Module } from '@nestjs/common';
import { resolvePersistence } from '../../common/config/profile';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import {
  LoyaltyRepository,
  InMemoryLoyaltyRepository,
  PrismaLoyaltyRepository,
} from './loyalty.repository';

const persistence = resolvePersistence();

@Module({
  controllers: [LoyaltyController],
  providers: [
    LoyaltyService,
    {
      provide: LoyaltyRepository,
      useClass: persistence === 'postgres' ? PrismaLoyaltyRepository : InMemoryLoyaltyRepository,
    },
  ],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
