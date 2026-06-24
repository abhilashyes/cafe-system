import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@Controller({ version: '1' })
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('stores/:storeId/menu')
  @UseGuards(AuthGuard)
  getStoreMenu(@Param('storeId') storeId: string) {
    return this.catalog.getStoreMenu(storeId);
  }

  @Put('stores/:storeId/products/:productId/availability')
  @UseGuards(AuthGuard)
  setAvailability(
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Body() body: { available: boolean },
  ) {
    this.catalog.setAvailability(storeId, productId, body.available);
    return { ok: true };
  }
}
