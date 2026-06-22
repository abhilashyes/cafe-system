import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CognitoGuard } from '../../common/auth/cognito.guard';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@Controller({ version: '1' })
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('stores/:storeId/menu')
  @UseGuards(CognitoGuard)
  getStoreMenu(@Param('storeId') storeId: string) {
    return this.catalog.getStoreMenu(storeId);
  }

  @Put('stores/:storeId/products/:productId/availability')
  @UseGuards(CognitoGuard)
  setAvailability(
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Body() body: { available: boolean },
  ) {
    this.catalog.setAvailability(storeId, productId, body.available);
    return { ok: true };
  }
}
