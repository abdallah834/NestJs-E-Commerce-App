import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepo } from 'src/common/repository';
import {
  ConfirmEmail,
  LoginBodyDTO,
  ResendConfirmationEmail,
  SignupBodyDTO,
} from './dto/authentication.dto';
import { CacheService } from 'src/common/services/redis/caching.service';
import { EmailService, SecurityService } from 'src/common/services';
import { IUser } from 'src/common/interfaces';
import { EmailEnum, ProviderEnums } from 'src/common/enums';
import { emailEmitter } from 'src/common/events';

@Injectable()
export class AuthenticationService {
  // to use a specified mongoose schema
  constructor(
    private emailService: EmailService,
    private readonly userRepository: UserRepo,
    private readonly redisService: CacheService,
    private readonly securityService: SecurityService,
  ) {}
  // async signup(data: SignupBodyDTO) {
  //   const checkExistingAccount = await this.userRepository.findOne({
  //     filter: { email: data.email },
  //   });
  //   await this.redisService.redisSet({ key: 'SignUp', value: 'Done' });
  //   if (checkExistingAccount) {
  //     throw new ConflictException('This account already exists');
  //   }
  //   const user = await this.userRepository.createOne({ data });
  //   return { signupIs: 'Done', user: user.toJSON() };
  // }
  async signup({
    username,
    email,
    password,
    phone,
  }: SignupBodyDTO): Promise<IUser> {
    // await userModel.create({ username, email, password });
    const checkExistingUser = await this.userRepository.findOne({
      filter: { email },
      projection: 'email',
      options: { lean: true },
    });

    if (checkExistingUser) {
      throw new ConflictException('This email already exists');
    }
    const user =
      (await this.userRepository.createOne({
        data: {
          username,
          email,
          password: password,
          phone: phone ? phone : null,
        },
      })) || [];

    if (!user) {
      throw new BadRequestException('Failed to create account');
    }
    emailEmitter.emit(EmailEnum.CONFIRM_EMAIL, async () => {
      await this.emailService.generateAndSendConfirmationOtp(email, {
        subject: EmailEnum.CONFIRM_EMAIL,
        title: 'Email verification',
      });
    });

    return user;
  }
  async login({ email, password, FCM }: LoginBodyDTO, issuer: string) {
    // : Promise<{ accessToken: string; refreshToken: string }>
    console.log(issuer);
    const user = await this.userRepository.findOne({
      filter: {
        email,
        provider: ProviderEnums.SYSTEM,
        confirmedAt: { $exists: true },
      },
    });
    if (!user) {
      throw new NotFoundException(
        'Please make sure to verify your account before login',
      );
    }

    if (
      !(await this.securityService.compareHash(
        user.password as string,
        password,
      ))
    ) {
      throw new BadRequestException('Invalid login credentials');
    }

    // user.phone = this.securityService.decrypt(user.phone as string);
    ///////////////// handling 2FA
    // if (user.TFAEnabled) {
    //   await generateAndSendConfirmationOtp(user.email);
    //   await redisSet({
    //     key: otp2FAVerification(user.email),
    //     value: await createLoginTokens(user, issuer),
    //     ttl: 120,
    //   });
    //   return "2FA";
    // }
    // handling multiple FCM tokens
    if (FCM) {
      await this.redisService.addFCM(user.id, FCM);
      const tokens = await this.redisService.getFCMs(user.id);
      if (tokens.length) {
        // const currentDate = new Date().toLocaleString().split(',');
        ////////////////////////// notification
        // await this.notification.sendMultipleNotifications({
        //   tokens,
        //   data: {
        //     title: 'Logged in successfully',
        //     body: `Logged in on ${currentDate[0]} at ${currentDate[1]}`,
        //   },
        // });
      }
    }
    //////////////////////////////////////////// using a secret key based on the user's role (admin | user)
    // return await createLoginTokens(user, issuer);
    // return this.tokenService.createLoginTokens(user, issuer);
  }
  async confirmEmail({ email, otp }: ConfirmEmail) {
    const existingAcc = await this.userRepository.findOne({
      filter: {
        email,
        confirmedAt: { $exists: false },
        provider: ProviderEnums.SYSTEM,
      },
      options: { lean: true },
    });
    if (!existingAcc) {
      throw new NotFoundException(
        "This account is either already verified or doesn't exist",
      );
    }

    const hashedOtp = await this.redisService.redisGet(
      this.redisService.otpKey(email, { type: EmailEnum.CONFIRM_EMAIL }),
    );

    if (!hashedOtp) {
      throw new NotFoundException('Expired OTP');
    }

    if (
      !(await this.securityService.compareHash(
        `${hashedOtp as string}`,
        `${otp}`,
      ))
    ) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.userRepository.updateOne({
      filter: { email },
      update: { confirmedAt: new Date() },
    });
    await this.redisService.redisDelKeys(
      await this.redisService.redisKeys(
        this.redisService.otpKey(email, { type: EmailEnum.CONFIRM_EMAIL }),
      ),
    );
    return;
  }

  async resendConfirmationEmail({ email }: ResendConfirmationEmail) {
    const account = await this.userRepository.findOne({
      filter: {
        email,
        confirmedAt: { $exists: false },
        provider: ProviderEnums.SYSTEM,
      },
    });

    if (!account) {
      throw new NotFoundException(
        'Account is either already verified or not found',
      );
    }
    const otpTtl = await this.redisService.redisGetTtl(
      this.redisService.otpKey(email, { type: EmailEnum.CONFIRM_EMAIL }),
    );

    if (otpTtl > 0) {
      throw new ConflictException(
        `Can't send a new OTP while the older OTP is still valid try again after ${otpTtl} ${otpTtl > 1 ? `seconds` : `second`}.`,
      );
    }
    emailEmitter.emit(EmailEnum.CONFIRM_EMAIL, async () => {
      await this.emailService.generateAndSendConfirmationOtp(email);
    });
    return;
  }
}
