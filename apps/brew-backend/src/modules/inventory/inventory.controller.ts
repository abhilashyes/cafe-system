import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CognitoGuard } from '../../common/auth/cognito.guard';
import { RbacGuard, RequirePermissions } from '../../common/auth/rbac';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@Controller({ version: '1' })
@UseGuards(CognitoGuard, RbacGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('stores/:storeId/inventory')
  @RequirePermissions('inventory:read')
  get(@Param('storeId') storeId: string) {
    return this.inventory.getStoreInventory(storeId);
  }

  @Post('stores/:storeId/wastage')
  @RequirePermissions('inventory:write')
  wastage(
    @Param('storeId') storeId: string,
    @Body() body: { ingredientId: string; quantity: number; reason: string },
  ) {
    this.inventory.logWastage(storeId, body.ingredientId, body.quantity, body.reason);
    return { ok: true };
  }
}
