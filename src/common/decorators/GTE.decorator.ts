import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

interface SignupFields {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  provider: number;
}
interface SignupFieldsValidation extends ValidationArguments {
  object: SignupFields;
}
// Custom validation classes
@ValidatorConstraint({ name: 'CheckGte', async: false })
export class CheckGte implements ValidatorConstraintInterface {
  validate(value: string, args: SignupFieldsValidation) {
    // console.log(args.object[args.constraints[1] as string]); ////to access the first constraint in this case "password" field
    return !(
      Number(args.object[args.constraints[0] as string]) > Number(value)
    ); // for async validations you must return a Promise<boolean> here
  }

  defaultMessage(args: SignupFieldsValidation) {
    // here you can provide default error message if validation failed
    return `${args.property} can't be less than ${args.constraints[0]}`;
  }
}

export function IsGreaterThanEqual(
  constraints?: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints,
      validator: CheckGte,
    });
  };
}
