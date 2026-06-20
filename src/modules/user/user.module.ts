import { MiddlewareConsumer, Module } from '@nestjs/common';
import { preAuthMiddleware } from 'src/common/middleware/authentication.middleware';
import { S3Service } from 'src/common/services';
import { UserController } from './user.controller';
import { UserService } from './user.service';
@Module({
  imports: [
    // MulterModule.register({
    //   storage: diskStorage({
    //     destination(
    //       req: Request,
    //       file: Express.Multer.File,
    //       callback: (error: Error | null, destination: string) => void,
    //     ) {
    //       return callback(null, './uploads');
    //     },
    //     filename(
    //       req: Request,
    //       file: Express.Multer.File,
    //       callback: (error: Error | null, destination: string) => void,
    //     ) {
    //       const uniqueFileName = randomUUID() + '_' + file.originalname;
    //       callback(null, uniqueFileName);
    //     },
    //   }),
    //   fileFilter(
    //     req: Request,
    //     file: Express.Multer.File,
    //     callback: (error: Error | null, acceptFile?: boolean) => void,
    //   ) {
    //     if (
    //       ['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype) ===
    //       false
    //     ) {
    //       callback(new BadRequestException('Invalid file format'));
    //     }
    //     callback(null, true);
    //   },
    //   // limits: { fileSize: 2 * 1024 * 1024 },
    // }),
  ],
  controllers: [UserController],
  providers: [UserService, S3Service],
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
