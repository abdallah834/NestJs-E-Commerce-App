import { PartialType } from '@nestjs/mapped-types';
import { CreateCartDto } from './create-cart.dto';
import { Types } from 'mongoose';
import { ArrayUnique, IsArray, IsMongoId } from 'class-validator';

export class UpdateCartDto extends PartialType(CreateCartDto) {}

export class RemovedItemsFromCart {
  @IsMongoId({ each: true })
  @IsArray()
  @ArrayUnique()
  productIds!: Types.ObjectId[] | string[];
}
