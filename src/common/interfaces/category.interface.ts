import { Types } from 'mongoose';
import { IBrand } from './brand.interface';
import { IUser } from './user.interface';

export interface ICategory {
  name: string;
  slug?: string;
  image: string;
  slider?: string[];
  brandIds: Types.ObjectId[] | IBrand[] | string[];
  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;
  createdAt?: Date;
  updatedAt?: Date;
  paranoid?: boolean;
  deletedAt?: Date;
  restoredAt?: Date;
}
