import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { ConsentPurpose, DsrType } from '@brew/contracts';
import { AuthGuard } from '../../common/auth/auth.guard';
import { RbacGuard, RequirePermissions } from '../../common/auth/rbac';
import { PrivacyService } from './privacy.service';

@ApiTags('privacy')
@Controller({ path: 'privacy', version: '1' })
@UseGuards(AuthGuard)
export class PrivacyController {
  constructor(private readonly privacy: PrivacyService) {}

  private subject(req: Request & { principal?: { subjectId: string } }): string {
    return req.principal?.subjectId ?? 'anonymous';
  }

  @Get('consents')
  consents(@Req() req: Request) {
    return this.privacy.getConsents(this.subject(req));
  }

  @Post('consents')
  setConsent(@Req() req: Request, @Body() body: { purpose: ConsentPurpose; granted: boolean }) {
    return this.privacy.setConsent(this.subject(req), body.purpose, body.granted);
  }

  @Post('dsr')
  createDsr(@Req() req: Request, @Body() body: { type: DsrType }) {
    return this.privacy.createDsr(this.subject(req), body.type);
  }

  @Get('retention')
  retention() {
    return this.privacy.listRetentionPolicies();
  }

  // --- Privacy Officer (DPO) operations, scoped by RBAC ---
  @Get('export')
  @UseGuards(RbacGuard)
  @RequirePermissions('privacy:dsr:manage')
  export(@Query('customerId') customerId: string) {
    return this.privacy.exportData(customerId);
  }

  @Post('erase')
  @UseGuards(RbacGuard)
  @RequirePermissions('privacy:dsr:manage')
  erase(@Body() body: { customerId: string }) {
    return this.privacy.erase(body.customerId);
  }
}
