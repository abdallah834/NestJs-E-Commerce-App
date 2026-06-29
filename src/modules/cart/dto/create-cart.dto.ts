import { IsInt, IsMongoId, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';
import { ICartProduct } from 'src/common/interfaces';

export class CreateCartDto implements ICartProduct {
  @IsMongoId({ each: true })
  @IsNotEmpty()
  productId!: Types.ObjectId | string;
  @IsInt()
  @IsNotEmpty()
  quantity!: number;
}
