import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CognitoGuard } from '../../common/auth/cognito.guard';
import { RbacGuard, RequirePermissions } from '../../common/auth/rbac';
import { ReportingService } from './reporting.service';

@ApiTags('reporting')
@Controller({ path: 'reports', version: '1' })
@UseGuards(CognitoGuard, RbacGuard)
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}

  @Get('sales')
  @RequirePermissions('report:read:store')
  sales(
    @Query('scopeLevel') scopeLevel = 'STORE',
    @Query('scopeId') scopeId = '',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reporting.salesReport(scopeLevel, scopeId, from, to);
  }

  @Get('item-profitability')
  @RequirePermissions('report:read:org')
  itemProfitability() {
    return this.reporting.itemProfitability();
  }

  @Get('unit-economics')
  @RequirePermissions('report:read:org')
  unitEconomics() {
    return this.reporting.unitEconomics();
  }
}
