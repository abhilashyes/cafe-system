import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/auth/auth.guard';
import { RbacGuard, RequirePermissions } from '../../common/auth/rbac';
import { ProcurementService, type PoLine } from './procurement.service';

@ApiTags('procurement')
@Controller({ version: '1' })
@UseGuards(AuthGuard, RbacGuard)
export class ProcurementController {
  constructor(private readonly procurement: ProcurementService) {}

  @Get('suppliers')
  @RequirePermissions('inventory:read')
  suppliers() {
    return this.procurement.listSuppliers();
  }

  @Get('purchase-orders')
  @RequirePermissions('inventory:read')
  list() {
    return this.procurement.listPurchaseOrders();
  }

  @Post('purchase-orders')
  @RequirePermissions('po:create')
  create(@Body() body: { supplierId: string; storeId: string; lines: PoLine[] }) {
    return this.procurement.createPurchaseOrder(body);
  }

  @Post('purchase-orders/:id/approve')
  @RequirePermissions('po:approve')
  approve(@Param('id') id: string) {
    return this.procurement.approve(id);
  }

  @Post('purchase-orders/:id/receive')
  @RequirePermissions('inventory:write')
  receive(@Param('id') id: string, @Body() body: { received?: PoLine[] }) {
    return this.procurement.receive(id, body?.received);
  }

  @Post('transfers')
  @RequirePermissions('inventory:write')
  transfer(
    @Body() body: { fromStoreId: string; toStoreId: string; ingredientId: string; quantity: number },
  ) {
    return this.procurement.createTransfer(body);
  }
}
