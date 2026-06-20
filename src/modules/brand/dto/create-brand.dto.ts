import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { IBrand } from 'src/common/interfaces';

export class CreateBrandDto implements Partial<IBrand> {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsNotEmpty()
  name!: string;
}
