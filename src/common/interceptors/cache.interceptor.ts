import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  catchError,
  from,
  mergeMap,
  Observable,
  of,
  throwError,
  TimeoutError,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { personalCacheName, ttlName } from '../enums';
import { CtxType, IAuthenticationRequest } from '../interfaces';
import { CacheService } from '../services';
import { GqlExecutionContext } from '@nestjs/graphql';

///////////////////////////////////////////////////////// Implementing app level cache
@Injectable()
export class CustomCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly redisService: CacheService,
    private readonly reflector: Reflector,
  ) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const ttl =
      this.reflector.getAllAndOverride<number>(ttlName, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 10;

    const personalCacheUse =
      this.reflector.getAllAndOverride<boolean>(personalCacheName, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;
    const req: IAuthenticationRequest = context.switchToHttp().getRequest();

    let url!: string;
    let userId!: string;
    const GqlCtx = GqlExecutionContext.create(context);

    switch (context.getType<CtxType>()) {
      case 'http':
        url = req.url;
        userId = req.credentials?.userAccount?._id.toString();
        break;
      case 'graphql':
        // getContext<{
        //   req: IAuthenticationRequest;
        // }>();
        url = JSON.stringify({
          key: GqlCtx.getInfo<{ path: { key: string } }>().path.key,
          typename: GqlCtx.getInfo<{ path: { typename: string } }>().path
            .typename,
          args: GqlCtx.getArgs<{
            page: string;
            size?: string;
            search?: string;
          }>(),
        });

        break;

      default:
        break;
    }
    const cacheKey = this.redisService.getCacheKey(
      url,
      personalCacheUse ? userId : undefined,
    );

    const data = await this.redisService.redisGet(cacheKey);
    if (data) {
      return of(data);
    }
    return next.handle().pipe(
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new RequestTimeoutException('Server took too long to respond'),
          );
        }
        return throwError(() => err as Observable<never>);
      }),
      mergeMap((value: string) =>
        // from() handles async operations by default
        from(
          this.redisService.redisSet({
            key: cacheKey,
            value,
            ttl,
          }),
        ).pipe(map(() => value)),
      ),
    );
  }
}

//
