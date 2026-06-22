import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CognitoGuard } from '../../common/auth/cognito.guard';
import { InvoicingService } from './invoicing.service';

@ApiTags('invoicing')
@Controller({ version: '1' })
@UseGuards(CognitoGuard)
export class InvoicingController {
  constructor(private readonly invoicing: InvoicingService) {}

  @Get('orders/:orderId/invoice')
  invoice(@Param('orderId') orderId: string) {
    return this.invoicing.buildForOrder(orderId);
  }
}
