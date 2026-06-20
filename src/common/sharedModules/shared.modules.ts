import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { UserModel } from 'src/models';
import { UserRepo } from '../repository';
import { CacheService, TokenService } from '../services';

// shared modules are used to import into other modules that may need the same providers as each other
// if this modules is needed in multiple modules it's better to have it as a global module (app level) and then it won't need to be imported
// after declaring it as a global module it is later imported into the app module
@Global()
@Module({
  imports: [UserModel],
  // to not redeclare another instance in multiple places which is a bad practice and can cause unnecessary performance issues we export already used services or controllers along with the main module
  controllers: [],
  exports: ['Redis_Client', UserRepo, CacheService, TokenService, JwtService],
  providers: [
    UserRepo,
    CacheService,
    TokenService,
    JwtService,
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
export class SharedAuthenticationModule {}
