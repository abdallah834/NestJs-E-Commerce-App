import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import Redis from 'ioredis';
import { Types } from 'mongoose';
import { EmailEnum } from '../../enums';

@Injectable()
export class CacheService {
  // the injected name must be the exact same name in the provide object in the providers array within the module the connection was established from
  constructor(@Inject('Redis_Client') private readonly client: Redis) {}

  /////////////////////////// redis operations
  async redisSet({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: any;
    ttl?: number | undefined;
  }): Promise<string | null> {
    try {
      const data = typeof value === 'string' ? value : JSON.stringify(value);
      return ttl
        ? await this.client.set(key, data, 'EX', ttl)
        : await this.client.set(key, data);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Something went wrong with setting the value',
      );
    }
  }
  async redisUpdate({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: string | object;
    ttl?: number | undefined;
  }): Promise<string | number | null> {
    try {
      // key has to exist before assigning it a different value
      if (!(await this.client.exists(key))) {
        return 0;
      }
      return await this.redisSet({ key, value, ttl });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Something went wrong with updating the value within redis',
      );
    }
  }
  async redisGet(
    key: string,
  ): Promise<string | number | [] | null | undefined> {
    try {
      const opResult = await this.client.get(key);
      try {
        if (!opResult) {
          return null;
        }
        return JSON.parse(opResult) as string | number | [];
      } catch (error) {
        if (error) {
          return opResult;
        }
      }
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Something went wrong with getting the value within redis',
      );
    }
  }
  async redisGetTtl(key: string): Promise<number> {
    try {
      if (!(await this.client.ttl(key))) {
        throw new NotFoundException(
          'The value you are trying to have a ttl enabled',
        );
      }
      return this.client.ttl(key);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Something went wrong with getting the ttl value within redis',
      );
    }
  }
  async redisCheckKey(key: string): Promise<number> {
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException("Key doesn't exist");
    }
  }
  async redisAddTtl({
    key,
    ttl,
  }: {
    key: string;
    ttl: string | number;
  }): Promise<number> {
    try {
      return await this.client.expire(key, ttl);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Failed to add ttl to the key');
    }
  }
  async redisMGet(keys: string[]): Promise<(string | null)[] | number> {
    try {
      if (!keys.length) {
        return 0;
      }
      return await this.client.mget(...keys);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed to get all of the specified keys',
      );
    }
  }
  async redisKeys(prefix: string): Promise<string[]> {
    try {
      return await this.client.keys(`${prefix}*`);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Failed to get keys');
    }
  }
  async redisDelKeys(keys: string[]): Promise<number> {
    try {
      if (!keys.length) return 0;
      return await this.client.del(keys);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Failed to delete keys');
    }
  }
  async redisIncrKey(key: string): Promise<number> {
    try {
      if (!(await this.client.exists(key))) return 0;
      return await this.client.incr(key);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Failed to increment keys');
    }
  }

  ///////////////////////// Redis keys
  redisBaseRevokeTokenKey(userId: string | Types.ObjectId | undefined): string {
    if (!userId) {
      throw new InternalServerErrorException('No user Id found');
    }

    return `RevokeToken::${userId.toString()}`;
  }
  redisRevokeTokenKey({
    userId,
    jti,
  }: {
    userId: string | Types.ObjectId | undefined;
    jti: string | undefined;
  }): string {
    return `${this.redisBaseRevokeTokenKey(userId)}::${jti}`;
  }
  otpKey(
    email: string,
    { type = EmailEnum.CONFIRM_EMAIL }: { type?: EmailEnum } = {},
  ): string {
    return `OTP::User::${email}::${type}`;
  }
  maxOtpRequestsKey(
    email: string,
    { type = EmailEnum.CONFIRM_EMAIL }: { type?: EmailEnum } = {},
  ): string {
    return `${this.otpKey(email, { type })}::Request`;
  }
  otpBlockKey(
    email: string,
    { type = EmailEnum.CONFIRM_EMAIL }: { type?: EmailEnum } = {},
  ): string {
    return `${this.otpKey(email, { type })}::Block::Request`;
  }

  generalLoginAttemptBlock(): string {
    return `OTP::Block::Request`;
  }

  otp2FAVerification(email: string): string {
    return `OTP::Verification::Token::${email}`;
  }
  unverifiedAccountDuration(email: string): string {
    return `User::AccountTTL::${email}`;
  } //////////////////////////////////////////////////////
  /////////////////////////// Storing FCM Tokens
  //////////////////////////////////////////////////////
  FCM_key(userId: string | Types.ObjectId) {
    return `user:FCM:${userId as string}`;
  }
  async addFCM(userId: string | Types.ObjectId, FCMToken: string) {
    return await this.client.sadd(this.FCM_key(userId), FCMToken);
  }

  async removeFCM(userId: string | Types.ObjectId, FCMToken: string) {
    return await this.client.srem(this.FCM_key(userId), FCMToken);
  }

  async getFCMs(userId: string | Types.ObjectId) {
    return await this.client.smembers(this.FCM_key(userId));
  }

  async hasFCMs(userId: string | Types.ObjectId) {
    return await this.client.scard(this.FCM_key(userId));
  }

  async removeFCMUser(userId: string | Types.ObjectId) {
    return await this.client.del(this.FCM_key(userId));
  }
  //////////////////////////////////////////////////////
  ////////////////////////////// socketIo
  //////////////////////////////////////////////////////
  socketKey(userId: string | Types.ObjectId) {
    return `user:sockets:${userId.toString()}`;
  }
  async addSocket(userId: string | Types.ObjectId, socketId: string) {
    return await this.client.sadd(this.socketKey(userId), socketId);
  }

  async removeSocket(userId: string | Types.ObjectId, socketId: string) {
    return await this.client.srem(this.socketKey(userId), socketId);
  }

  async getSockets(userId: string | Types.ObjectId) {
    return await this.client.smembers(this.socketKey(userId));
  }

  async hasSockets(userId: string | Types.ObjectId) {
    return await this.client.scard(this.socketKey(userId));
  }

  async removeUserSockets(userId: string | Types.ObjectId) {
    return await this.client.del(this.socketKey(userId));
  }
}
