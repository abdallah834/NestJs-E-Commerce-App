import { Types } from 'mongoose';
import { GenderEnums, LanguageEnum, ProviderEnums, RoleEnums } from '../enums';

export interface IUser {
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  password?: string;
  phone?: string;
  bio?: string;
  preferredLanguage?: LanguageEnum;
  friends?: Types.ObjectId[] | IUser[];
  DOB?: Date;
  provider: ProviderEnums;
  confirmedAt?: Date;
  profileImage?: string;
  coverImages?: string[];
  role: RoleEnums;
  gender: GenderEnums;
  createdAt?: Date;
  updatedAt?: Date;
  paranoid?: boolean;
  deletedAt?: Date;
  restoredAt?: Date;
  changedCredentialsTime?: Date;
}
