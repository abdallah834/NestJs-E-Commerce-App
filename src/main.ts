import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor, WatchInterceptor } from './common/interceptors';
import { LanguageInterceptor } from './common/interceptors/language.interceptor';
import * as express from 'express';
import { resolve } from 'path';
import * as ngrok from '@ngrok/ngrok';

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
  // stripe webhook requires a raw req body
  app.use('/order/webhook', express.raw({ type: 'application/json' }));
  // app.use(defaultLanguage);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.listen(process.env.PORT as string);
  console.log(`Server is running on port: ${process.env.PORT}`);

  if (process.env.NODE_ENV !== 'production') {
    const listener = await ngrok.forward({
      addr: process.env.PORT,
      authtoken_from_env: true,
    });

    console.log(`Public ngrok URL: ${listener.url()}`);
  }
}

bootstrap();
