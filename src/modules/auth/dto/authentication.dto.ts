// import z from 'zod';
// import { login, signup } from '../authentication.validation';
// // export class SignupDTO {
// //   userName!: string;
// //   email!: string;
// //   password!: string;
// //   confirmPassword!: string;
// // }

import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';
import { CheckFieldsMatch } from 'src/common/decorators';

// export type SignupDTO = z.infer<typeof signup>;
// export type LoginDTO = z.infer<typeof login>;

export class LoginBodyDTO {
  // using class validator pkg
  @IsEmail({}, { message: 'Incorrect email format' })
  @IsNotEmpty({ message: 'Please make sure to include a valid email' })
  email!: string;

  @IsStrongPassword()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsOptional()
  FCM?: string;
}
export class SignupBodyDTO extends LoginBodyDTO {
  @IsString({ message: 'Username must be a string' })
  @Length(2, 20, {
    message: 'Username must exceed 2 characters and be less than 20',
  })
  @IsNotEmpty({ message: 'Username is required' })
  username!: string;
  //using custom decorator to match between 2 or more fields
  // only validating if there's a password sent
  @ValidateIf((signupBody: SignupBodyDTO) => {
    return Boolean(signupBody.password);
  })
  @CheckFieldsMatch<string>(['password'])
  @IsNotEmpty({ message: 'Make sure to include password confirmation' })
  confirmPassword!: string;
  @IsOptional()
  @IsString()
  @Length(2, 11, {
    message: 'phone number must exceed 2 characters and be less than 11',
  })
  @Matches(/^(00201|\+201|01)(0|1|2|5)\d{8}$/, {
    message: 'please make sure to enter a valid phone number',
  })
  phone?: string;
}
export class ResendConfirmationEmail {
  @IsEmail({}, { message: 'Incorrect email format' })
  @IsNotEmpty()
  email!: string;
}
export class ConfirmEmail extends ResendConfirmationEmail {
  @Matches(/^\d{6}$/, { message: 'Please make sure to enter a valid OTP code' })
  @IsNotEmpty()
  otp!: string;
}
export class GmailTokenAndIss {
  @IsNotEmpty()
  idToken!: string;
  @IsNotEmpty()
  issuer!: string;
}
export class VerifyPasswordReset extends ConfirmEmail {
  @IsStrongPassword()
  @IsNotEmpty()
  newPassword!: string;
}
export class ParamsDTO {
  // @Transform
  flag!: boolean;
}
