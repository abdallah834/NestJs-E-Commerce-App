import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { Request } from 'express';
import { Connection, Types } from 'mongoose';
import { OrderStatusEnum, PaymentTypeEnum } from 'src/common/enums';
import { CouponTypeEnum } from 'src/common/enums/coupon.enum';
import { IOrder, IOrderedProducts } from 'src/common/interfaces';
import { CartRepo, OrderRepo, ProductRepo } from 'src/common/repository';
import { CouponRepo } from 'src/common/repository/coupon.repo';
import { PaymentService } from 'src/common/services';
import {
  hydratedCouponDocument,
  hydratedOrderDocument,
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
import { RealTimeGateWay } from '../realtime/realtime.gateway';
import { InjectConnection } from 'node_modules/@nestjs/mongoose/dist';
import { isDuplicateKeyError } from 'src/common/utils/mongoose';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepo,
    private readonly productRepo: ProductRepo,
    private readonly cartRepo: CartRepo,
    private readonly couponRepo: CouponRepo,
    private readonly cartService: CartService,
    private readonly paymentService: PaymentService,
    private readonly realtimeGateway: RealTimeGateWay,
    @InjectConnection() private readonly connection: Connection,
  ) {}
  private hashRequest(dto: CreateOrderDto): string {
    const { address, currency, phoneNumber, couponName, note, paymentType } =
      dto;
    return createHash('sha256')
      .update(
        JSON.stringify({
          address,
          currency,
          phoneNumber,
          couponName,
          note,
          paymentType,
        }),
      )
      .digest('hex');
  }
  private async findReplay(
    userId: Types.ObjectId,
    idempotencyKey: string,
    requestHash: string,
  ): Promise<IOrder | null> {
    const existing = await this.orderRepo.findOne({
      filter: { createdBy: userId, idempotencyKey },
    });
    if (!existing) return null;

    if (existing.requestHash !== requestHash) {
      throw new UnprocessableEntityException(
        'This Idempotency-Key was already used with a different request',
      );
    }
    return existing.toJSON();
  }
  async create(
    dto: CreateOrderDto,
    user: hydratedUserDocument,
    idempotencyKey: string,
  ): Promise<IOrder> {
    const requestHash = this.hashRequest(dto);
    // must come before the cart check .
    const replay = await this.findReplay(user._id, idempotencyKey, requestHash);
    // Returning the original result.
    if (replay) return replay;

    const userCart = await this.cartRepo.findOne({
      filter: { createdBy: user._id },
    });
    if (!userCart?.products.length) {
      throw new NotFoundException('Cart is either empty or not found');
    }

    const session = await this.connection.startSession();
    try {
      let placedOrder!: hydratedOrderDocument;
      let productsStock: { productId: Types.ObjectId; stock: number }[] = [];

      await session.withTransaction(
        async () => {
          productsStock = [];
          const orderedProducts: IOrderedProducts[] = [];
          let totalOrderPrice = 0;

          // 1. Atomic check + decrement in one operation per product
          for (const item of userCart.products) {
            const product = await this.productRepo.findOneAndUpdate({
              filter: { _id: item.productId, stock: { $gte: item.quantity } },
              update: { $inc: { stock: -item.quantity } },
              options: { new: true, session },
            });
            if (!product) {
              throw new ConflictException(
                `Product ${item.productId as string} is out of stock`,
              );
            }

            const total = item.quantity * product.finalPrice;
            orderedProducts.push({
              productId: item.productId as Types.ObjectId,
              quantity: item.quantity,
              unitAmount: product.finalPrice,
              total,
            });
            totalOrderPrice += total;
            productsStock.push({
              productId: product._id,
              stock: product.stock,
            });
          }

          // 2. Coupon: atomic validation + usage record
          let orderCoupon: hydratedCouponDocument | null = null;
          if (dto.couponName) {
            const now = new Date();
            orderCoupon = await this.couponRepo.findOneAndUpdate({
              filter: {
                couponName: dto.couponName,
                startDate: { $lt: now },
                endDate: { $gt: now },
                $expr: {
                  $lt: [
                    {
                      $size: {
                        $filter: {
                          input: { $ifNull: ['$usedBy', []] },
                          cond: { $eq: ['$$this.userId', user._id] },
                        },
                      },
                    },
                    '$usageAmount',
                  ],
                },
              },
              update: { $push: { usedBy: { userId: user._id, usedAt: now } } },
              options: { new: true, session },
            });
            if (!orderCoupon) {
              throw new BadRequestException(
                'Invalid coupon or usage limit reached',
              );
            }
          }

          // 3. Pricing
          let subTotal = totalOrderPrice;
          let discountPercentage = 0;
          if (orderCoupon) {
            const discountAmount =
              orderCoupon.couponType === CouponTypeEnum.PERCENTAGE
                ? totalOrderPrice * (orderCoupon.discount / 100)
                : Math.min(orderCoupon.discount, totalOrderPrice);
            subTotal = totalOrderPrice - discountAmount;
            discountPercentage = (discountAmount / totalOrderPrice) * 100;
          }

          // 4. Create the order
          placedOrder = await this.orderRepo.createOne({
            data: {
              ...dto,
              total: totalOrderPrice,
              subTotal,
              discountPercentage,
              ...(orderCoupon ? { couponId: orderCoupon._id } : {}),
              orderId: randomUUID().slice(0, 6),
              createdBy: user._id,
              products: orderedProducts,
              idempotencyKey,
              requestHash,
            },
            options: { session },
          });

          // 5. Clear the cart (same session)
          await this.cartService.remove(user, { session });
        },
        { writeConcern: { w: 'majority' }, readConcern: { level: 'snapshot' } },
      );

      this.realtimeGateway.changeStock(productsStock);
      return placedOrder.toJSON();
    } catch (err: unknown) {
      //  Race path: two identical requests arrived at the same moment.
      //    The unique index rejected the loser (and its transaction rolled back,so its stock decrements and coupon use were undone).
      if (isDuplicateKeyError(err, 'idempotencyKey')) {
        const winner = await this.findReplay(
          user._id,
          idempotencyKey,
          requestHash,
        );
        if (winner) return winner;
      }
      throw err;
    } finally {
      await session.endSession();
    }
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
      //////////////// restore stock for every product in the order
      for (const orderedProduct of order.products) {
        await this.productRepo.findOneAndUpdate({
          filter: { _id: orderedProduct.productId },
          update: { $inc: { stock: orderedProduct.quantity } },
        });
      }

      //////////////// regenerate a cart for the user with the same products
      await this.cartRepo.createOne({
        data: {
          createdBy: user._id,
          products: order.products.map((orderedProduct) => ({
            productId: orderedProduct.productId,
            quantity: orderedProduct.quantity,
          })),
        },
      });

      //////////////// remove the user's coupon usage record, if a coupon was applied
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
