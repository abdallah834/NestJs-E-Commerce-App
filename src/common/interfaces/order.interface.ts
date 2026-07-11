import { Types } from 'mongoose';
import { CurrencyTypeEnum, OrderStatusEnum, PaymentTypeEnum } from '../enums';
import { IProduct } from './products.interface';
import { IUser } from './user.interface';
import { ICoupon } from './coupon.interface';
export interface IOrderedProducts {
  productId: Types.ObjectId | IProduct;
  quantity: number;
  unitAmount: number;
  total: number;
}
export interface IOrder {
  orderId: string;
  couponId?: Types.ObjectId | ICoupon;
  intentId?: string;
  address: string;
  phoneNumber: string;
  note?: string;
  total: number;
  discountPercentage?: number;
  subTotal: number;
  status?: OrderStatusEnum;
  paymentType: PaymentTypeEnum;
  currency: CurrencyTypeEnum;
  products: IOrderedProducts[];
  canceledBy?: {
    userId: Types.ObjectId | IUser;
    canceledAt: Date;
    note?: string;
  };
  paidAt?: Date;
  refundedAt?: Date;
  createdBy?: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;
  createdAt?: Date;
  updatedAt?: Date;
  paranoid?: boolean;
  deletedAt?: Date;
  restoredAt?: Date;
}
