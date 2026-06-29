import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticationModule } from './modules/auth/authentication.module';
import { BrandModule } from './modules/brand/brand.module';
import { CategoryModule } from './modules/category/category.module';
import { OrderModule } from './modules/order/order.module';
import { ProductModule } from './modules/product/product.module';
import { UserModule } from './modules/user/user.module';
import { SharedAuthenticationModule } from './common/sharedModules';
import { CacheModule } from '@nestjs/cache-manager';
import { CartModule } from './modules/cart/cart.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

@Module({
  // we mainly import modules here along with their imports ex:AuthenticationModule ---> AuthenticationController ---> AuthenticationService

  imports: [
    ////////////////////// caching GET requests
    CacheModule.register({ isGlobal: true, ttl: 10000 }),
    ConfigModule.forRoot({
      // if nest can't find an env variable in dev it will then continue to look for the same variable in prod
      envFilePath: ['.env.development', '.env.production'],
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      graphiql: true,
    }),

    // linking database using @nestjs/mongoose pkg
    MongooseModule.forRoot(process.env.DB_URI as string),
    SharedAuthenticationModule,
    AuthenticationModule,
    UserModule,
    ProductModule,
    CategoryModule,
    CartModule,
    OrderModule,
    BrandModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
console.log(process.env.DB_URI);
