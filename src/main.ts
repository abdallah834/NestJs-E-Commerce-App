import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor, WatchInterceptor } from './common/interceptors';
import { LanguageInterceptor } from './common/interceptors/language.interceptor';
import * as express from 'express';
import { resolve } from 'path';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  // app.enableCors();
  // this line shows all images being fetched from url "localhost:3100/upload/(filename)"
  app.use('/upload', express.static(resolve('./uploads')));
  ////////// using a middleware globally
  app.useGlobalInterceptors(
    // testing code execution latency | performance
    new WatchInterceptor(),
    // handling default language
    new LanguageInterceptor(),
    // handling default response type
    new ResponseInterceptor(),
  );
  // app.use(defaultLanguage);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.listen(process.env.PORT as string);

  console.log(`Server is running on port: ${process.env.PORT}`);
}

bootstrap();
