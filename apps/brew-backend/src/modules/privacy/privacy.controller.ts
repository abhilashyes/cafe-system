import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { ConsentPurpose, DsrType } from '@brew/contracts';
import { CognitoGuard } from '../../common/auth/cognito.guard';
import { PrivacyService } from './privacy.service';

@ApiTags('privacy')
@Controller({ path: 'privacy', version: '1' })
@UseGuards(CognitoGuard)
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
}
