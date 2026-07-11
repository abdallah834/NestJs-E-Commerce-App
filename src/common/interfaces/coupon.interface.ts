import { Types } from 'mongoose';
import { CouponTypeEnum } from '../enums/coupon.enum';
import { IUser } from './user.interface';

export interface ICoupon {
  couponType: CouponTypeEnum;
  couponName: string;
  discount?: number;
  slug?: string;
  image: string;
  startDate: Date;
  endDate: Date;
  usageAmount: number;
  usedBy?: { userId: Types.ObjectId; orderId: Types.ObjectId; usedAt: Date }[];
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: Types.ObjectId | string | IUser;
  updatedBy?: Types.ObjectId | string | IUser;
  deletedAt?: Date;
  restoredAt?: Date;
  paranoid?: boolean;
}
