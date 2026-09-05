import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import Redis from 'ioredis';

import { IoredisThrottlerStorageService } from './throttler-storage.service';
import { UserThrottlerGuard } from 'src/common/guards';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: ['Redis_Client'],
      useFactory: (redisClient: Redis) => ({
        throttlers: [
          {
            // global default: applies to any route without its own @Throttle()
            name: 'default',
            ttl: 60000, // 1 minute window
            limit: 100, // 100 requests / minute
          },
        ],
        // Shared, atomic store so limits are consistent across multiple app
        // instances and safe under concurrent requests on the same key.
        // Reuses the exact same connection CacheService already uses.
        storage: new IoredisThrottlerStorageService(redisClient),
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      // Use our custom guard globally instead of the default ThrottlerGuard,
      // so user-based keying is available everywhere without extra wiring.
      useClass: UserThrottlerGuard,
    },
  ],
})
export class AppModule {}
