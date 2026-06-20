import { PartialType } from '@nestjs/mapped-types';
import { IsMongoId } from 'class-validator';
import { Types } from 'mongoose';
import { CreateBrandDto } from './create-brand.dto';

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}
export class UpdateBrandParamsDto {
  @IsMongoId()
  brandId!: string | Types.ObjectId;
}
