import { Module } from '@nestjs/common';
import { CartRepo, OrderRepo, ProductRepo } from 'src/common/repository';
import { CouponRepo } from 'src/common/repository/coupon.repo';
import { PaymentService } from 'src/common/services';
import { CartModel, CouponModel, OrderModel, ProductModel } from 'src/models';
import { CartService } from '../cart/cart.service';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { RealTimeGateWay } from '../realtime/realtime.gateway';

@Module({
  imports: [OrderModel, ProductModel, CartModel, CouponModel],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepo,
    ProductRepo,
    CartRepo,
    CouponRepo,
    CartService,
    PaymentService,
    RealTimeGateWay,
  ],
})
export class OrderModule {}
