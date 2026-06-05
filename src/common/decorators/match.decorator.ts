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
@ValidatorConstraint({ name: 'passwordMatching', async: false })
export class MatchBetweenFields<
  T = any,
> implements ValidatorConstraintInterface {
  validate(value: T, args: SignupFieldsValidation) {
    // console.log(args.object[args.constraints[1] as string]); ////to access the first constraint in this case "password" field
    return args.object[args.constraints[0] as string] == value; // for async validations you must return a Promise<boolean> here
  }

  defaultMessage(args: SignupFieldsValidation) {
    // here you can provide default error message if validation failed
    return `Failed to match ${args.property} with ${args.constraints[0]}`;
  }
}

// to validate multiple fields with each other or do any complex logic on them we pass the constraints string[]
export function CheckFieldsMatch<T = any>(
  constraints?: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints,
      validator: MatchBetweenFields<T>,
    });
  };
}
