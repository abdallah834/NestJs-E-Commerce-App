import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import crypto from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurityService {
  // using built in config service to always make sure env variables are loaded
  constructor(private configService: ConfigService) {}

  generateHash = async (plainTxt: string): Promise<string> => {
    // the ideal argon hashing options for AWS 2 core CPU and 1GB of RAM
    const hashValue = await argon2.hash(plainTxt, {
      type: argon2.argon2id,
      timeCost: 8,
      memoryCost: 65536,
      parallelism: 1,
    });
    return hashValue;
  };

  compareHash = async (
    cipherTxt: string,
    plainTxt: string,
  ): Promise<boolean> => {
    const match = await argon2.verify(cipherTxt, plainTxt);
    return match;
  };

  encrypt = (text: string): string => {
    const iv = crypto.randomBytes(Number(this.configService.get('IV_LENGTH')));
    const ENCRYPTION_SECRET_KEY = Buffer.from(
      this.configService.get<string>('ENCRYPTION_BYTE') as string,
    );
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      ENCRYPTION_SECRET_KEY,
      iv,
    );
    let encryptedData = cipher.update(text, 'utf-8', 'hex');
    encryptedData += cipher.final('hex');
    return `${iv.toString('hex')}:${encryptedData}`;
  };
  decrypt = (encryptedData: string): string => {
    const [iv, encryptedTxt] = encryptedData.split(':');
    if (!iv || !encryptedTxt) {
      throw new BadRequestException('Invalid encryption parts');
    }
    const binaryLikeIv = Buffer.from(iv, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      this.configService.get<string>('ENCRYPTION_SECRET_KEY') as string,
      binaryLikeIv,
    );
    let decryptedData = decipher.update(encryptedTxt, 'hex', 'utf-8');
    decryptedData += decipher.final('utf-8');
    return decryptedData;
  };
}
