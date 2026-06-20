import { IUser } from './user.interface';
import { Types } from 'mongoose';

export interface IBrand {
  name: string;
  slogan?: string;
  slug?: string;
  image: string;
  slider?: string[];
  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;
  createdAt?: Date;
  updatedAt?: Date;
  paranoid?: boolean;
  deletedAt?: Date;
  restoredAt?: Date;
}
