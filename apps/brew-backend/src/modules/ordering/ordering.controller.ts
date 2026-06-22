import { Body, Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CognitoGuard } from '../../common/auth/cognito.guard';
import { RbacGuard, RequirePermissions } from '../../common/auth/rbac';
import { OrderingService } from './ordering.service';
import { CreateOrderDto } from './dto';

@ApiTags('orders')
@Controller({ path: 'orders', version: '1' })
@UseGuards(CognitoGuard, RbacGuard)
export class OrderingController {
  constructor(private readonly orders: OrderingService) {}

  @Post()
  @RequirePermissions('order:create')
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @Get(':id')
  @RequirePermissions('order:read')
  get(@Param('id') id: string) {
    const order = this.orders.get(id);
    if (!order) throw new NotFoundException();
    return order;
  }

  @Post(':id/ready')
  @RequirePermissions('order:update')
  async markReady(@Param('id') id: string) {
    const order = await this.orders.markReady(id);
    if (!order) throw new NotFoundException();
    return order;
  }
}
