import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import Mail from 'nodemailer/lib/mailer';
import nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { EmailConfig, EmailEnum } from 'src/common/enums';
import { CacheService } from '../redis';
import { SecurityService } from '../security';

@Injectable()
export class EmailService {
  private GOOGLE_EMAIL: string;
  private GOOGLE_APP_PASSWORD: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly redis: CacheService,
    private readonly securityService: SecurityService,
  ) {
    this.GOOGLE_EMAIL = this.configService.get<string>(
      'GOOGLE_EMAIL',
    ) as string;
    this.GOOGLE_APP_PASSWORD = this.configService.get<string>(
      'GOOGLE_APP_PASSWORD',
    ) as string;
  }
  generateOTP = () => {
    return Math.floor(Math.random() * 900000 + 100000);
  };
  sendEmail = async ({
    to,
    cc,
    bcc,
    subject,
    html,
    text,
    attachments = [],
  }: Mail.Options): Promise<void> => {
    if (!to && !cc && !bcc) {
      throw new BadRequestException('Invalid recipient');
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.GOOGLE_EMAIL,
        pass: this.GOOGLE_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Social-Media-App Verification"`,
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      attachments,
    });

    // console.log({ "message sent": info.messageId });
  };
  emailTemplate = () => {
    // HTML template
    return;
  };

  async generateAndSendConfirmationOtp(
    email: string,
    {
      subject = EmailEnum.CONFIRM_EMAIL,
      // title = 'Email verification',
    }: { subject?: EmailEnum; title?: string } = {},
  ) {
    /////////////// checking if there is a blocked timer
    const blockKey = this.redis.otpBlockKey(email, { type: subject });
    const maxRequests = this.redis.maxOtpRequestsKey(email, {
      type: subject,
    });
    const [remainingBlockTime, checkMaxOtpRequests, maxRequestsTtl] =
      await Promise.all([
        this.redis.redisGetTtl(blockKey),
        this.redis.redisGet(maxRequests),
        this.redis.redisGetTtl(this.redis.maxOtpRequestsKey(email)),
      ]);
    const maxRequestsNum = Number(checkMaxOtpRequests);
    if (remainingBlockTime > 0) {
      throw new ConflictException(
        `You have been blocked from requesting newer OTPs try again after ${remainingBlockTime} ${remainingBlockTime > 1 ? `seconds` : `second`}`,
      );
    }

    /////////////// handling max attempts for OTP requests

    if (maxRequestsNum >= 3) {
      await this.redis.redisSet({
        key: blockKey,
        value: 1,
        ttl: 7 * 60,
      });
      throw new ConflictException(
        `You have reached the maximum amount of requests for the OTP try again after ${maxRequestsTtl} ${maxRequestsTtl > 1 ? `second` : `seconds`}`,
      );
    }
    const generatedOtp = this.generateOTP();
    await this.redis.redisSet({
      key: this.redis.otpKey(email, { type: subject }),
      value: await this.securityService.generateHash(`${generatedOtp}`),
      ttl: 120,
    });
    if (maxRequestsNum > 0) {
      await this.redis.redisIncrKey(maxRequests);
    }
    await this.redis.redisSet({ key: maxRequests, value: 1, ttl: 300 });

    await this.sendEmail({
      to: email,
      subject: EmailConfig[subject].title,
      html: `<span>The confirmation code for your account is</span><h2>${generatedOtp}</h2>`,
    });

    return;
  }
}

// using OAuth for better security
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     type: "OAuth2",
//     user: GOOGLE_EMAIL,
//     clientId: WEB_CLIENT_ID,
//     clientSecret: CLIENT_SECRET,
//     refreshToken: GOOGLE_REFRESH_TOKEN,
//   },
// });
// const generateOTP = async () => {
//   return crypto.randomInt(100000, 999999);
// };
