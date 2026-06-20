import { Types } from 'mongoose';
import { IUser } from './user.interface';
import { ICategory } from './category.interface';
import { IBrand } from './brand.interface';

export interface IProduct {
  name: string;
  description: string;
  referenceId: string;
  image: string;
  stock: number;
  originalPrice: number;
  salePrice: number;
  finalPrice: number;
  categoryId: Types.ObjectId[] | ICategory[] | string | Types.ObjectId;
  brandId: Types.ObjectId[] | IBrand[] | string | Types.ObjectId;
  rating?: number;
  discountPercentage?: number;
  slug?: string;
  gallery?: string[];
  notifyUsers?: Types.ObjectId[] | IUser[];
  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;
  createdAt?: Date;
  updatedAt?: Date;
  paranoid?: boolean;
  deletedAt?: Date;
  restoredAt?: Date;
}
