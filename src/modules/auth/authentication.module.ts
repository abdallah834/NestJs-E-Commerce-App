import { Module } from '@nestjs/common';
import { UserRepo } from 'src/common/repository';
import { UserModel } from 'src/models';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { CacheService } from 'src/common/services/redis/caching.service';
import { EmailService, SecurityService } from 'src/common/services';
@Module({
  imports: [UserModel],
  // to not redeclare another instance in multiple places which is a bad practice and can cause unnecessary performance issues we export already used services or controllers along with the main module
  controllers: [AuthenticationController],
  exports: ['Redis_Client'],
  providers: [
    AuthenticationService,
    UserRepo,
    CacheService,
    EmailService,
    SecurityService,
    {
      provide: 'Redis_Client',
      useFactory: (configService: ConfigService) => {
        const redisConnectionLink = configService.get('REDIS_URL') as string;
        const redisClient = new Redis(redisConnectionLink);
        redisClient.on('error', () => {
          console.log('Failed to connect to redis');
        });
        redisClient.on('connect', () => {
          console.log('Redis connection established');
        });
        return redisClient;
      },
      /////////////////// in order for Config service to work it needs to be injected
      inject: [ConfigService],
    },
  ],
})
export class AuthenticationModule {
  constructor() {}
}
