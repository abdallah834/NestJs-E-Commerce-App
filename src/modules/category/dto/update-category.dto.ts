import { PartialType } from '@nestjs/mapped-types';
import { ArrayUnique, IsArray, IsMongoId, IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { IBrand } from 'src/common/interfaces';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ArrayUnique()
  @IsMongoId({ each: true })
  @IsArray()
  @IsOptional()
  removeBrandIds?: Types.ObjectId[] | IBrand[] | string[] | undefined;
}

export class UpdateCategoryParamsDto {
  @IsMongoId()
  categoryId!: Types.ObjectId | string;
}
