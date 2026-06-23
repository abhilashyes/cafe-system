import { Body, Controller, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CognitoGuard } from '../../common/auth/cognito.guard';
import { RbacGuard, RequirePermissions } from '../../common/auth/rbac';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  @UseGuards(CognitoGuard, RbacGuard)
  @RequirePermissions('payment:create')
  create(
    @Body() body: { orderId: string; storeId: string; method: any; amountPaise: number },
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    return this.payments.create(body, idempotencyKey);
  }

  @Post(':id/refund')
  @UseGuards(CognitoGuard, RbacGuard)
  @RequirePermissions('refund:approve')
  refund(@Param('id') id: string, @Body() body: { amountPaise?: number }) {
    return this.payments.refund(id, body?.amountPaise);
  }

  /** Public endpoint — authenticity established via signature, not JWT. */
  @Post('webhook')
  async webhook(@Req() req: Request, @Headers('x-razorpay-signature') signature: string) {
    await this.payments.handleWebhook(JSON.stringify(req.body ?? {}), signature);
    return { received: true };
  }
}
