import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CurrencyTypeEnum, PaymentTypeEnum } from 'src/common/enums';
import { IOrder } from 'src/common/interfaces';

export class CreateOrderDto implements Partial<IOrder> {
  @IsString()
  @MinLength(10)
  @MaxLength(250)
  address!: string;
  @Matches(/^(00201|\+201|01)(0|1|2|5)\d{8}$/)
  phoneNumber!: string;
  @IsEnum(CurrencyTypeEnum, { message: 'currency must be either egp or usd' })
  currency!: CurrencyTypeEnum;
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(250)
  note?: string | undefined;
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  couponName?: string | undefined;
  @IsNotEmpty()
  @IsEnum(PaymentTypeEnum, {
    message: 'Payment method must be either cash on delivery or card',
  })
  paymentType!: PaymentTypeEnum;
}

export class ConfirmOrderParamsDto {
  @IsMongoId()
  @IsString()
  orderId!: string;
}
export class orderCheckoutTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class CancelOrderParamsDto extends ConfirmOrderParamsDto {}
