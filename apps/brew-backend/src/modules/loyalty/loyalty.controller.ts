import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';

@ApiTags('loyalty')
@Controller({ path: 'loyalty', version: '1' })
export class LoyaltyController {
  constructor(private readonly loyalty: LoyaltyService) {}

  @Get('tiers')
  tiers() {
    return this.loyalty.listTiers();
  }

  @Get('rewards')
  rewards() {
    return this.loyalty.listRewards();
  }

  @Post('redeem')
  redeem(@Body() body: { customerId: string; rewardId: string; orderId?: string }) {
    return this.loyalty.redeem(body.customerId, body.rewardId, body.orderId);
  }

  @Get('accounts/:customerId')
  account(@Param('customerId') customerId: string) {
    return this.loyalty.getAccount(customerId);
  }

  @Get('accounts/:customerId/ledger')
  ledger(@Param('customerId') customerId: string) {
    return this.loyalty.getLedger(customerId);
  }
}
