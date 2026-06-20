import { PartialType } from '@nestjs/mapped-types';
import {
  ArrayUnique,
  IsArray,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsString({ each: true })
  @IsArray()
  @ArrayUnique()
  @IsOptional()
  removeGallery?: string[];
}
export class UpdateProductParamsDto {
  @IsMongoId()
  productId!: Types.ObjectId | string;
}
