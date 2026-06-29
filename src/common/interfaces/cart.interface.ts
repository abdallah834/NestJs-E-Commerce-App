import { Types } from 'mongoose';
import type { IUser } from './user.interface';
import { IProduct } from './products.interface';

export class ICartProduct {
  productId!: Types.ObjectId | string | IProduct;
  quantity!: number;
}
export class ICart {
  createdBy!: Types.ObjectId | IUser;
  products!: ICartProduct[];
  createdAt?: Date;
  updatedAt?: Date;
}
