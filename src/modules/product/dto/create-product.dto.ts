import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';
import { IsGreaterThanEqual } from 'src/common/decorators';
import { IProduct } from 'src/common/interfaces';

export class CreateProductDto implements Partial<IProduct> {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  description!: string;
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @Max(300)
  stock!: number;
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @Max(999999999)
  @IsGreaterThanEqual(['originalPrice'])
  salePrice!: number;
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @Max(999999999)
  originalPrice!: number;
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsPositive()
  @Min(0)
  @Max(100)
  @IsOptional()
  discountPercentage?: number | undefined;
  @IsNotEmpty()
  @IsMongoId()
  brandId!: string | Types.ObjectId;
  @IsNotEmpty()
  @IsMongoId()
  categoryId!: string | Types.ObjectId;
}
// ArgsType returns the args as an object without having to destruct
@ArgsType()
// InputType  returns the args as an object but you have to destruct
// @InputType()
export class SayHiInputDto {
  @Field(() => String, { nullable: false })
  @IsNotEmpty()
  @IsString()
  name!: string;
  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  age?: number;
}
