import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  // app.enableCors();
  ////////// using a middleware globally
  // app.use(defaultLanguage);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.listen(process.env.PORT as string);
  console.log(`Server is running on port: ${process.env.PORT}`);
}

bootstrap();
