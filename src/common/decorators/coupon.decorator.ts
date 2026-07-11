import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { CouponTypeEnum } from '../enums/coupon.enum';

// Custom validation classes
@ValidatorConstraint({ name: 'CheckValidDate', async: false })
export class CheckValidDate implements ValidatorConstraintInterface {
  validate(value: Date, args: ValidationArguments) {
    return (
      new Date(value).getTime() >
      new Date(args.object[args.constraints[0] as string] as string).getTime()
    ); // for async validations you must return a Promise<boolean> here
  }

  defaultMessage() {
    // here you can provide default error message if validation failed
    return `End date can't be the same as or before start date`;
  }
}

export function IsValidDate(
  constraints?: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints,
      validator: CheckValidDate,
    });
  };
}

@ValidatorConstraint({ name: 'IsDateGreaterThanNow', async: false })
export class IsDateGreaterThanNow implements ValidatorConstraintInterface {
  validate(value: Date) {
    return new Date(value).getTime() > Date.now(); // for async validations you must return a Promise<boolean> here
  }

  defaultMessage() {
    // here you can provide default error message if validation failed
    return `Start date can't be in the past`;
  }
}

export function IsDateGtn(
  constraints?: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints,
      validator: IsDateGreaterThanNow,
    });
  };
}
@ValidatorConstraint({ name: 'CouponDiscount', async: false })
export class CouponDiscount implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments) {
    if (
      (args.object['couponType'] as CouponTypeEnum) ===
        CouponTypeEnum.PERCENTAGE &&
      value > 100
    ) {
      return false;
    }
    return true;
    // for async validations you must return a Promise<boolean> here
  }

  defaultMessage() {
    // here you can provide default error message if validation failed
    return `Discount percentage can't be be greater than 100`;
  }
}

export function IsValidDiscount(
  constraints?: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints,
      validator: CouponDiscount,
    });
  };
}
