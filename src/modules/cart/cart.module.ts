import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CartRepo, ProductRepo } from 'src/common/repository';
import { CartModel, ProductModel } from 'src/models';

@Module({
  imports: [CartModel, ProductModel],
  controllers: [CartController],
  providers: [CartService, CartRepo, ProductRepo],
})
export class CartModule {}
