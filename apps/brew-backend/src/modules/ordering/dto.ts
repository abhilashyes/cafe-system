import { IsArray, IsIn, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemInputDto {
  @IsString() productId!: string;
  @IsInt() @Min(1) quantity!: number;
  @IsOptional() @IsArray() modifierOptionIds?: string[];
}

export class CreateOrderDto {
  @IsString() storeId!: string;
  @IsIn(['MOBILE_PREORDER', 'WALK_IN', 'AGGREGATOR']) channel!:
    | 'MOBILE_PREORDER'
    | 'WALK_IN'
    | 'AGGREGATOR';
  @IsIn(['DINE_IN', 'TAKEAWAY']) fulfilment!: 'DINE_IN' | 'TAKEAWAY';
  @IsOptional() @IsString() tableNumber?: string;
  @IsOptional() @IsString() scheduledFor?: string;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() customerName?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];
}
