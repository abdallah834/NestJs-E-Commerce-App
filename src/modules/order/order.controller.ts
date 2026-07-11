import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Auth, User } from 'src/common/decorators';
import { RoleEnums } from 'src/common/enums';
import { IOrder } from 'src/common/interfaces';
import type { hydratedUserDocument } from 'src/models';
import {
  CancelOrderParamsDto,
  ConfirmOrderParamsDto,
  CreateOrderDto,
  orderCheckoutTokenDto,
} from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderService } from './order.service';
import type { Request } from 'express';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Auth({ roles: [RoleEnums.ADMIN, RoleEnums.USER] })
  @Post()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @User() user: hydratedUserDocument,
  ): Promise<IOrder> {
    return await this.orderService.create(createOrderDto, user);
  }
  @Auth({ roles: [RoleEnums.ADMIN] })
  @Patch('/:orderId/confirm')
  async confirmOrder(
    @Param() confirmOrderParams: ConfirmOrderParamsDto,
    @User() user: hydratedUserDocument,
  ) {
    return await this.orderService.confirmOrder(confirmOrderParams, user);
  }
  @Auth({ roles: [RoleEnums.ADMIN, RoleEnums.USER] })
  @Post('/:orderId/checkout')
  async orderCheckout(
    @Param() confirmOrderParams: ConfirmOrderParamsDto,
    @Body() orderCheckoutToken: orderCheckoutTokenDto,
    @User() user: hydratedUserDocument,
  ) {
    return await this.orderService.orderCheckout(
      confirmOrderParams,
      orderCheckoutToken,
      user,
    );
  }
  @Auth({ roles: [RoleEnums.ADMIN] })
  @Post('/:orderId/cancel')
  async cancelOrder(
    @Param() cancelOrderParams: CancelOrderParamsDto,
    @User() user: hydratedUserDocument,
  ) {
    return await this.orderService.cancelOrder(cancelOrderParams, user);
  }

  @Post('/webhook')
  async stripeWebhook(@Req() req: Request) {
    return await this.orderService.initStripeWebhook(req);
  }
  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(+id);
  }
}
