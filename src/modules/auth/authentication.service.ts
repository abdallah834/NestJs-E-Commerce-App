import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmailEnum, ProviderEnums } from 'src/common/enums';
import { emailEmitter } from 'src/common/events';
import { IUser } from 'src/common/interfaces';
import { UserRepo } from 'src/common/repository';
import {
  EmailService,
  SecurityService,
  TokenService,
} from 'src/common/services';
import { CacheService } from 'src/common/services/redis/caching.service';
import {
  ConfirmEmail,
  LoginBodyDTO,
  ResendConfirmationEmail,
  SignupBodyDTO,
} from './dto/authentication.dto';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { LoginResponse } from './entities/authentication.entity';

@Injectable()
export class AuthenticationService {
  // to use a specified mongoose schema
  WEB_CLIENT_ID: string;
  constructor(
    private readonly JWTService: TokenService,
    private emailService: EmailService,
    private readonly userRepository: UserRepo,
    private readonly redisService: CacheService,
    private readonly securityService: SecurityService,
    private readonly configService: ConfigService,
  ) {
    this.WEB_CLIENT_ID = this.configService.get('WEB_CLIENT_ID') as string;
  }

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
  async login(
    { email, password, FCM }: LoginBodyDTO,
    issuer: string,
  ): Promise<LoginResponse> {
    // : Promise<{ accessToken: string; refreshToken: string }>
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
    return await this.JWTService.createLoginTokens(user, issuer);
    //////////////////////////////////////////// using a secret key based on the user's role (admin | user)
    // return await createLoginTokens(user, issuer);
    // return this.tokenService.createLoginTokens(user, issuer);
  }
  async confirmEmail({ email, otp }: ConfirmEmail): Promise<void> {
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

  async resendConfirmationEmail({
    email,
  }: ResendConfirmationEmail): Promise<void> {
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

  //////////////// Google login and signup
  async verifyGoogleAccount(idToken: string): Promise<TokenPayload> {
    const client = new OAuth2Client();

    const ticket = await client.verifyIdToken({
      idToken,
      audience: this.WEB_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new BadRequestException('No payload found');
    if (!payload.email_verified) {
      throw new BadRequestException(
        'Failed to authenticate this account with gmail',
      );
    }
    return payload;
  }
  async loginWithGmail(
    idToken: string,
    issuer: string,
  ): Promise<LoginResponse> {
    const payload = await this.verifyGoogleAccount(idToken);
    const existingUser = await this.userRepository.findOne({
      filter: {
        email: payload.email as string,
        provider: ProviderEnums.GOOGLE,
      },
    });
    if (!existingUser) {
      throw new BadRequestException(
        'Invalid login credentials or not a registered account',
      );
    }

    return await this.JWTService.createLoginTokens(existingUser, issuer);
  }
  async signupWithGmail(
    idToken: string,
    issuer: string,
  ): Promise<{
    loginTokens: LoginResponse;
    status: number;
  }> {
    const payload = await this.verifyGoogleAccount(idToken);

    const existingUser = await this.userRepository.findOne({
      filter: {
        email: payload.email as string,
      },
    });
    if (existingUser) {
      if (existingUser.provider !== ProviderEnums.GOOGLE) {
        throw new ConflictException('Invalid account provider');
      }
      const loginTokens = await this.loginWithGmail(idToken, issuer);
      return { loginTokens, status: 200 };
    }
    const createdUser = await this.userRepository.createOne({
      data: {
        firstName: payload.given_name,
        lastName: payload.family_name,
        email: payload.email,
        provider: ProviderEnums.GOOGLE,
        profileImage: payload.picture,
        confirmedAt: new Date(),
      },
    });

    return {
      status: 201,
      loginTokens: await this.JWTService.createLoginTokens(createdUser, issuer),
    };
  }
}
