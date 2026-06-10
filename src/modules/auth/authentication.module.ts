import { Module } from '@nestjs/common';
import { EmailService, SecurityService } from 'src/common/services';
import { SharedAuthenticationModule } from 'src/common/sharedModules';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';

@Module({
  imports: [SharedAuthenticationModule],
  // to not redeclare another instance in multiple places which is a bad practice and can cause unnecessary performance issues we export already used services or controllers along with the main module
  controllers: [AuthenticationController],
  providers: [AuthenticationService, EmailService, SecurityService],
})
export class AuthenticationModule {
  // middlewares in nestjs can be used either at app level or module level
  // configure(consumer: MiddlewareConsumer) {
  //   // multiple middleware could be used as well defaultLanguage,defaultLanguage2
  //   consumer
  //     .apply(defaultLanguage, AuthenticationMiddleware)
  //     .forRoutes({ path: 'auth/*', method: RequestMethod.ALL });
  //   // .exclude()
  //   // { path: 'auth/login', method: RequestMethod.POST },
  //   // "auth"
  //   // AuthenticationController
  //   // { path: 'auth/signup', method: RequestMethod.POST },
  //   // { path: 'auth/*', method: RequestMethod.POST },
  // }
}
