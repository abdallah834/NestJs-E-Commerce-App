import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { Types } from 'mongoose';
import { OrderStatusEnum, PaymentTypeEnum } from 'src/common/enums';
import { CouponTypeEnum } from 'src/common/enums/coupon.enum';
import { IOrder, IOrderedProducts } from 'src/common/interfaces';
import { CartRepo, OrderRepo, ProductRepo } from 'src/common/repository';
import { CouponRepo } from 'src/common/repository/coupon.repo';
import { PaymentService } from 'src/common/services';
import {
  hydratedCouponDocument,
  hydratedProductDocument,
  hydratedUserDocument,
} from 'src/models';
import { CartService } from './../cart/cart.service';
import {
  ConfirmOrderParamsDto,
  CreateOrderDto,
  orderCheckoutTokenDto,
} from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepo,
    private readonly productRepo: ProductRepo,
    private readonly cartRepo: CartRepo,
    private readonly couponRepo: CouponRepo,
    private readonly cartService: CartService,
    private readonly paymentService: PaymentService,
  ) {}
  async create(
    {
      address,
      currency,
      phoneNumber,
      couponName,
      note,
      paymentType,
    }: CreateOrderDto,
    user: hydratedUserDocument,
  ): Promise<IOrder> {
    const userCart = await this.cartRepo.findOne({
      filter: { createdBy: user._id },
    });
    if (!userCart || !userCart.products.length) {
      throw new NotFoundException('Cart is either empty or not found');
    }
    let orderCoupon!: hydratedCouponDocument;
    if (couponName) {
      orderCoupon = (await this.couponRepo.findOne({
        filter: {
          couponName,
          startDate: { $lt: new Date(Date.now()) },
          endDate: { $gt: new Date(Date.now()) },
        },
      })) as hydratedCouponDocument;
      if (!orderCoupon) {
        throw new NotFoundException('Invalid coupon');
      }
      /////////////////// checking coupon usage amount
      if (orderCoupon.usedBy) {
        const couponUsageLeft = orderCoupon.usedBy.filter(
          (usedByInfo) => usedByInfo.userId.toString() === user._id.toString(),
        ).length;
        if (couponUsageLeft >= orderCoupon.usageAmount) {
          throw new BadRequestException('Coupon usage limit reached');
        }
      }
    }
    const orderedProducts: IOrderedProducts[] = [];
    let totalOrderPrice: number = 0;
    for (const cartProduct of userCart.products) {
      const matchingProduct = await this.productRepo.findOne({
        filter: {
          _id: cartProduct.productId,
          stock: { $gte: cartProduct.quantity },
        },
      });

      if (!matchingProduct) {
        throw new NotFoundException('Some products were not found');
      }
      const sum = cartProduct.quantity * matchingProduct.finalPrice;
      orderedProducts.push({
        productId: cartProduct.productId as Types.ObjectId,
        quantity: cartProduct.quantity,
        unitAmount: matchingProduct.finalPrice,
        total: sum,
      });
      totalOrderPrice += sum;
    }
    let subTotal = totalOrderPrice;
    let discountPercentage = 0;
    if (orderCoupon) {
      discountPercentage =
        orderCoupon.discount &&
        orderCoupon.couponType === CouponTypeEnum.PERCENTAGE
          ? orderCoupon.discount
          : Number(
              ((orderCoupon.discount as number) / totalOrderPrice).toFixed(2),
            ) * 100;

      if (discountPercentage) {
        subTotal =
          subTotal - subTotal * Number((discountPercentage / 100).toFixed(2));
      }
    }
    const placedOrder = await this.orderRepo.createOne({
      data: {
        address,
        currency,
        phoneNumber,
        total: totalOrderPrice,
        subTotal,
        discountPercentage,
        note,
        ...(orderCoupon ? { couponId: orderCoupon._id } : {}),
        orderId: randomUUID().slice(0, 6),
        createdBy: user._id,
        products: orderedProducts,
        paymentType,
      },
    });
    if (!placedOrder) {
      throw new BadRequestException('Failed to create order');
    }
    const productsStock: { productId: Types.ObjectId; stock: number }[] = [];
    for (const cartProduct of userCart.products) {
      const matchingProduct = await this.productRepo.findOneAndUpdate({
        filter: { _id: cartProduct.productId },
        update: { $inc: { stock: -cartProduct.quantity } },
      });
      productsStock.push({
        productId: matchingProduct?._id as Types.ObjectId,
        stock: matchingProduct?.stock as number,
      });
    }

    if (orderCoupon) {
      orderCoupon.usedBy?.push({
        userId: user._id,
        orderId: placedOrder._id,
        usedAt: new Date(Date.now()),
      });
      await orderCoupon.save();
    }
    await this.cartService.remove(user);
    return placedOrder.toJSON();
  }
  async confirmOrder(
    { orderId }: ConfirmOrderParamsDto,
    user: hydratedUserDocument,
  ) {
    const order = await this.orderRepo.findOneAndUpdate({
      filter: {
        _id: Types.ObjectId.createFromHexString(orderId),
        status: OrderStatusEnum.PENDING,
        paranoid: false,
      },
      update: {
        status: OrderStatusEnum.PLACED,
        updatedBy: user._id,
      },
    });
    if (!order) {
      throw new NotFoundException("Couldn't find this specified order");
    }
    return order.toJSON();
  }
  async orderCheckout(
    { orderId }: ConfirmOrderParamsDto,
    { token }: orderCheckoutTokenDto,
    user: hydratedUserDocument,
  ) {
    const checkoutOrder = await this.orderRepo.findOne({
      filter: {
        _id: Types.ObjectId.createFromHexString(orderId),
        status: OrderStatusEnum.PENDING,
        paidAt: { $exists: false },
        paymentType: PaymentTypeEnum.CARD,
        createdBy: user._id,
        paranoid: false,
      },
      options: { populate: [{ path: 'products.productId' }] },
    });
    if (!checkoutOrder) {
      throw new NotFoundException('No orders found for this user');
    }
    const discounts: any[] = [];
    if (checkoutOrder.discountPercentage) {
      const stripeCoupon = await this.paymentService.createStripeCoupon({
        percent_off: checkoutOrder.discountPercentage,
        duration: 'once',
        currency: checkoutOrder.currency,
      });

      discounts.push({ coupon: stripeCoupon.id });
    }
    const checkoutSession = await this.paymentService.checkoutSession({
      customer_email: user.email,
      metadata: { orderId: checkoutOrder._id.toString() },
      line_items: checkoutOrder.products.map((product) => {
        return {
          quantity: product.quantity,
          price_data: {
            currency: checkoutOrder.currency,
            product_data: {
              name: (product.productId as hydratedProductDocument).name,
              // images: (product.productId as hydratedProductDocument).image,
            },
            // we multiply by 100 here since the price is in cents
            unit_amount: product.unitAmount * 100,
          },
        };
      }),
      discounts,
      // line_items: [
      //   {
      //     quantity: checkoutOrder.products,
      //     price_data: { currency, product_data: { name, images }, unit_amount },
      //   },
      // ],
    });
    const checkoutMethod = await this.paymentService.createPaymentMethod(token);
    const paymentIntent = await this.paymentService.createPaymentIntent({
      amount: checkoutOrder.subTotal * 100,
      currency: checkoutOrder.currency,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      payment_method: checkoutMethod.id,
    });

    checkoutOrder.intentId = paymentIntent.id;
    await checkoutOrder.save();
    return checkoutSession;
  }
  async initStripeWebhook(req: Request): Promise<void> {
    const event = this.paymentService.stripeWebhook(req);
    const { orderId } = event.data.object.metadata as { orderId: string };
    const checkoutOrder = await this.orderRepo.findOneAndUpdate({
      filter: {
        _id: Types.ObjectId.createFromHexString(orderId),
        status: OrderStatusEnum.PENDING,
        paidAt: { $exists: false },
        paymentType: PaymentTypeEnum.CARD,
        paranoid: false,
      },
      update: { paidAt: new Date(Date.now()) },
    });
    if (!checkoutOrder) {
      throw new NotFoundException('No orders found for this user');
    }
    if (checkoutOrder.intentId) {
      await this.paymentService.confirmPaymentIntent(checkoutOrder.intentId);
    }
  }

  async cancelOrder(
    { orderId }: ConfirmOrderParamsDto,
    user: hydratedUserDocument,
  ) {
    const order = await this.orderRepo.findOneAndUpdate({
      filter: {
        _id: Types.ObjectId.createFromHexString(orderId),
        status: { $ne: OrderStatusEnum.CANCELED },
        paranoid: false,
      },
      update: {
        status: OrderStatusEnum.CANCELED,
        updatedBy: user._id,
      },
    });

    if (!order) {
      throw new NotFoundException("Couldn't find this specified order");
    }
    if (
      order.paymentType === PaymentTypeEnum.CARD &&
      order.intentId &&
      order.paidAt &&
      !order.refundedAt
    ) {
      await this.paymentService.handleOrderRefund(order.intentId);
      order.status = OrderStatusEnum.REFUNDED;
      order.refundedAt = new Date(Date.now());

      await order.save();
      // Restore stock for every product in the order
      for (const orderedProduct of order.products) {
        await this.productRepo.findOneAndUpdate({
          filter: { _id: orderedProduct.productId },
          update: { $inc: { stock: orderedProduct.quantity } },
        });
      }

      // Regenerate a cart for the user with the same products
      await this.cartRepo.createOne({
        data: {
          createdBy: user._id,
          products: order.products.map((orderedProduct) => ({
            productId: orderedProduct.productId,
            quantity: orderedProduct.quantity,
          })),
        },
      });

      // Remove the user's coupon usage record, if a coupon was applied
      if (order.couponId) {
        await this.couponRepo.findOneAndUpdate({
          filter: { _id: order.couponId },
          update: {
            $pull: {
              usedBy: { userId: user._id, orderId: order._id },
            },
          },
        });
      }
    }

    return order.toJSON();
  }
  findAll() {
    return `This action returns all order`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
