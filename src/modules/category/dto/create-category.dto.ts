import {
  ArrayUnique,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';
import { IBrand, ICategory } from 'src/common/interfaces';

export class CreateCategoryDto implements Partial<ICategory> {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsNotEmpty()
  name!: string;
  @ArrayUnique()
  @IsMongoId({ each: true })
  @IsArray()
  @IsOptional()
  brandIds?: Types.ObjectId[] | IBrand[] | string[] | undefined;
}
