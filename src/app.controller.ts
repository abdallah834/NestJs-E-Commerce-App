import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Get, Inject, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { CustomCacheInterceptor } from './common/interceptors/cache.interceptor';
import { ttl } from './common/enums';

@Controller()
export class AppController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly appService: AppService,
  ) {}

  // using the cache ttl decorator will overwrite the TTL value declared in the app module
  // @CacheTTL(25000)
  @ttl(30)
  @UseInterceptors(CustomCacheInterceptor)
  @Get()
  getHello(): Date {
    const data = new Date();

    return data;
  }
}
