import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { IsDateGtn, IsValidDate, IsValidDiscount } from 'src/common/decorators';
import { CouponTypeEnum } from 'src/common/enums/coupon.enum';
import { ICoupon } from 'src/common/interfaces';

export class CreateCouponDto implements Partial<ICoupon> {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  couponName!: string;
  @IsDateString()
  @IsDateGtn()
  startDate!: Date;
  @IsDateString()
  @IsValidDate(['startDate'])
  endDate!: Date;
  @IsEnum(CouponTypeEnum)
  @Transform(({ value }) => Number(value))
  couponType!: CouponTypeEnum;
  @Transform(({ value }) => Number(value))
  @Min(1)
  @IsInt()
  @Max(5)
  usageAmount!: number;
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  @IsValidDiscount()
  discount!: number;
}
