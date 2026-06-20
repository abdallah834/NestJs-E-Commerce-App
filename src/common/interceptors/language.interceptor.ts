import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { IAuthenticationRequest } from '../interfaces';
import { LanguageEnum } from '../enums';

@Injectable()
export class LanguageInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<IAuthenticationRequest>();
    switch (context.getType()) {
      case 'http':
        req.headers['accept-language'] ??=
          req.credentials?.userAccount?.preferredLanguage ?? LanguageEnum.EN;
        break;

      default:
        break;
    }
    return next.handle().pipe();
  }
}
