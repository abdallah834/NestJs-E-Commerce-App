import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import type { IBrand, ICategory, IProduct, IUser } from 'src/common/interfaces';
import { SingleUserResponse } from 'src/modules/user/entities/user.entities';
///////// GQL types
@ObjectType()
export class SayHiResponse {
  @Field(() => String, { nullable: false })
  name!: string;
  @Field(() => Int, { nullable: true })
  age?: string;
}
@ObjectType()
class SingleProductResponse implements Partial<IProduct> {
  @Field(() => ID)
  _id!: Types.ObjectId;
  @Field(() => [ID])
  brandId!: string | Types.ObjectId | Types.ObjectId[] | IBrand[];
  @Field(() => [ID])
  categoryId!: string | Types.ObjectId | Types.ObjectId[] | ICategory[];
  @Field(() => SingleUserResponse)
  createdBy!: IUser;
  @Field(() => ID, { nullable: true })
  updatedBy?: Types.ObjectId | IUser | undefined;
  @Field(() => [ID], { nullable: true })
  notifyUsers?: Types.ObjectId[] | IUser[] | undefined;
  @Field(() => Float)
  originalPrice!: number;
  @Field(() => Float)
  discountPercentage!: number;
  @Field(() => Float)
  salePrice!: number;
  @Field(() => Float)
  finalPrice!: number;
  @Field(() => Float, { nullable: true })
  rating?: number | undefined;
  @Field(() => Int)
  stock!: number;
  @Field(() => String)
  description!: string | undefined;
  @Field(() => String)
  name!: string;
  @Field(() => String)
  slug!: string;
  @Field(() => String)
  referenceId!: string | undefined;
  @Field(() => [String], { nullable: true })
  gallery?: string[] | undefined;
  @Field(() => String)
  image!: string;
  @Field(() => String)
  createdAt!: Date;
  @Field(() => String, { nullable: true })
  updatedAt?: Date | undefined;
  @Field(() => String, { nullable: true })
  deletedAt?: Date | undefined;
  @Field(() => String, { nullable: true })
  restoredAt?: Date | undefined;
}
@ObjectType()
export class PaginateProductsResponse {
  @Field(() => Int, { nullable: true })
  currentPage?: number | undefined;
  @Field(() => Int, { nullable: true })
  size?: number | undefined;
  @Field(() => Int, { nullable: true })
  pages?: number | undefined;
  @Field(() => [SingleProductResponse])
  docs!: IProduct[];
}
