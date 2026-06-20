import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { catchError, Observable, tap, throwError, TimeoutError } from 'rxjs';

@Injectable()
export class WatchInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
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
      tap(() => console.log(`After ${Date.now() - now}ms`)),
    );
  }
}
