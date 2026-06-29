import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';

import { map, Observable } from 'rxjs';
export interface Response<T> {
  data: T;
}
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType<string>() === 'http') {
      const httpRequestUrl = context
        .switchToHttp()
        .getRequest<Request>()
        .url?.split('/');
      if (httpRequestUrl.includes('login')) {
        return next.handle().pipe(
          map((data: T) => ({
            message: 'Login Success',
            data,
          })),
        );
      } else if (httpRequestUrl.includes('confirmEmail')) {
        return next.handle().pipe(
          map((data: T) => ({
            message: 'Account confirmation completed',
            data,
          })),
        );
      } else if (httpRequestUrl.includes('resendConfirmationEmail')) {
        return next.handle().pipe(
          map((data: T) => ({
            message: 'OTP resent successfully',
            data,
          })),
        );
      }
    }

    return next.handle().pipe(
      map((data: { message: string; data: any }) => {
        let result = data;
        switch (context.getType<string>()) {
          case 'http':
            result = { message: 'Success', data };
            break;
          case 'graphql':
            break;

          default:
            break;
        }
        return result;
      }),
    );
  }
}
