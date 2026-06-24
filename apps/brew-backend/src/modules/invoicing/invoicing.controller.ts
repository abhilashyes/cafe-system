import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/auth/auth.guard';
import { InvoicingService } from './invoicing.service';

@ApiTags('invoicing')
@Controller({ version: '1' })
@UseGuards(AuthGuard)
export class InvoicingController {
  constructor(private readonly invoicing: InvoicingService) {}

  @Get('orders/:orderId/invoice')
  invoice(@Param('orderId') orderId: string) {
    return this.invoicing.buildForOrder(orderId);
  }
}
