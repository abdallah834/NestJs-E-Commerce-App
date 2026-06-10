import { MiddlewareConsumer, Module } from '@nestjs/common';
import { preAuthMiddleware } from 'src/common/middleware/authentication.middleware';
import { SharedAuthenticationModule } from 'src/common/sharedModules';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [SharedAuthenticationModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {
  configure(consumer: MiddlewareConsumer) {
    // multiple middleware could be used as well defaultLanguage,defaultLanguage2
    consumer.apply(preAuthMiddleware).forRoutes(UserController);
    // .exclude()
    // { path: 'auth/login', method: RequestMethod.POST },
    // "auth"
    // AuthenticationController
    // { path: 'auth/signup', method: RequestMethod.POST },
    // { path: 'auth/*', method: RequestMethod.POST },
  }
}
