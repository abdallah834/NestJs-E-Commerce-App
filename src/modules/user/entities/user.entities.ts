import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import {
  GenderEnums,
  LanguageEnum,
  ProviderEnums,
  RoleEnums,
} from 'src/common/enums';
import { IUser } from 'src/common/interfaces';
registerEnumType(GenderEnums, { name: 'GenderEnums' });
registerEnumType(ProviderEnums, { name: 'ProviderEnums' });
registerEnumType(RoleEnums, { name: 'RoleEnums' });
registerEnumType(LanguageEnum, { name: 'LanguageEnum' });
// in order to avoid any errors during product population we create a single response for the interface to later use with product entity and others
@ObjectType()
export class SingleUserResponse implements Partial<IUser> {
  @Field(() => ID)
  _id!: Types.ObjectId;
  @Field(() => String)
  email!: string;
  @Field(() => String)
  username!: string;
  @Field(() => String)
  firstName!: string;
  @Field(() => String)
  lastName!: string;
  @Field(() => String, { nullable: true })
  password?: string | undefined;
  @Field(() => String, { nullable: true })
  bio?: string | undefined;
  @Field(() => String, { nullable: true })
  phone?: string | undefined;
  @Field(() => [String], { nullable: true })
  coverImages?: string[] | undefined;
  @Field(() => String, { nullable: true })
  profileImage?: string;
  @Field(() => GenderEnums)
  gender?: GenderEnums;
  @Field(() => ProviderEnums)
  provider?: ProviderEnums;
  @Field(() => RoleEnums)
  role?: RoleEnums;
  @Field(() => LanguageEnum)
  preferredLanguage?: LanguageEnum;
  @Field(() => String)
  createdAt!: Date;
  @Field(() => String, { nullable: true })
  DOB?: Date | undefined;
  @Field(() => String, { nullable: true })
  changedCredentialsTime?: Date | undefined;
  @Field(() => String, { nullable: true })
  updatedAt?: Date | undefined;
  @Field(() => String, { nullable: true })
  deletedAt?: Date | undefined;
  @Field(() => String, { nullable: true })
  restoredAt?: Date | undefined;
  @Field(() => String, { nullable: true })
  confirmedAt?: Date | undefined;
}
