import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IdentityService } from './identity.service';

@ApiTags('identity')
@Controller({ version: '1' })
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Post('auth/otp/start')
  async startOtp(@Body() body: { phone: string }) {
    await this.identity.startOtp(body.phone);
    return { dispatched: true };
  }

  @Post('auth/otp/verify')
  verifyOtp(@Body() body: { phone: string; code: string }) {
    return this.identity.verifyOtp(body.phone, body.code);
  }

  @Get('roles')
  listRoles() {
    return this.identity.listRoles();
  }
}
