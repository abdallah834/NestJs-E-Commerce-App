import { InternalServerErrorException } from '@nestjs/common';
import EventEmitter from 'node:events';
import { EmailEnum } from 'src/common/enums';

export const emailEmitter = new EventEmitter();
////// on sending an email for email confirmation
emailEmitter.on(
  EmailEnum.CONFIRM_EMAIL,
  (emailFunction: () => Promise<void>) => {
    try {
      emailFunction()
        .then()
        .catch((err) => {
          console.log('failed to deliver mail', err);
        });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed to send verification mail to user',
      );
    }
  },
);
////// on sending an email for forgetting password

emailEmitter.on(
  EmailEnum.FORGOT_PASSWORD,
  (emailFunction: () => Promise<void>) => {
    try {
      emailFunction()
        .then()
        .catch((err) => {
          console.log('failed to deliver mail', err);
        });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed to send verification mail to user',
      );
    }
  },
);
////// on sending an email for 2FA
emailEmitter.on(
  EmailEnum.TWO_STEP_VERIFICATION,
  (emailFunction: () => Promise<void>) => {
    try {
      emailFunction()
        .then()
        .catch((err) => {
          console.log('failed to deliver mail', err);
        });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed to send verification mail to user',
      );
    }
  },
);
