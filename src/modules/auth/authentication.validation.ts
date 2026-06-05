// import z from 'zod';

// export const singUp = z.strictObject({
//   username: z.string().max(30),
//   email: z.email(),
//   password: z
//     .string()
//     .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,16}$/, {
//       error: 'Make sure to follow the indicated password pattern',
//     }),
// });

import { generalValidationFields } from 'src/common/validation/general.validation';
import { z } from 'zod';

export const resendConfirmationEmail = {
  body: z.strictObject({
    email: generalValidationFields.email,
  }),
};

export const login = z.strictObject({
  email: z.email({
    error: 'Please make sure to enter a valid email address',
  }),
  password: z.string({
    error: 'Password is required',
  }),
  // FCM has to be optional because notifications might be disabled by user
  FCM: z.string().optional(),
});

export const signup = z
  .strictObject({
    username: generalValidationFields.username,
    email: generalValidationFields.email,
    password: generalValidationFields.password,
    phone: generalValidationFields.phone.optional(),
    confirmPassword: generalValidationFields.confirmPassword,
    gender: generalValidationFields.gender.optional(),
  })
  .refine(
    // for multiple logic we use superRefine instead
    (inputs) => {
      return inputs.password === inputs.confirmPassword;
    },
    { error: 'Make sure that both passwords match' },
  );

export const confirmEmail = {
  body: resendConfirmationEmail.body.safeExtend({
    otp: generalValidationFields.otp,
  }),
};
export const gmailTokenAndIss = {
  body: z.strictObject({
    idToken: z.string({
      error: 'Gmail id token is required',
    }),
    issuer: z.string({
      error: 'Issuer is missing',
    }),
  }),
};

export const verifyPasswordReset = {
  body: confirmEmail.body.safeExtend({
    newPassword: generalValidationFields.password,
  }),
};
