import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import StripeConstructor, {
  CouponCreateParams,
  PaymentIntentCreateParams,
  Response,
} from 'stripe';

@Injectable()
export class PaymentService {
  private readonly stripe: StripeConstructor;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>(
      'STRIPE_SECRET_KEY',
    ) as string;
    this.stripe = new StripeConstructor(apiKey);
  }
  async checkoutSession({
    customer_email,
    metadata = {},
    // cancel_url = this.configService.get<string>('CANCEL_URL'),
    // success_url = this.configService.get<string>('SUCCESS_URL'),
    discounts = [],
    mode = 'payment',
    line_items,
  }: StripeConstructor.Checkout.SessionCreateParams): Promise<
    Response<StripeConstructor.Checkout.Session>
  > {
    const session = await this.stripe.checkout.sessions.create({
      customer_email,
      metadata,
      cancel_url: 'https://youtube.com',
      success_url: 'https://google.com',
      discounts,
      mode,
      line_items,
    });
    return session;
  }
  async createStripeCoupon(
    couponCreationParams: CouponCreateParams,
  ): Promise<Response<StripeConstructor.Coupon>> {
    return await this.stripe.coupons.create(couponCreationParams);
  }
  async createPaymentMethod(token: string) {
    return await this.stripe.paymentMethods.create({
      type: 'card',
      card: { token },
    });
  }
  async createPaymentIntent(IntentCreationParams: PaymentIntentCreateParams) {
    return await this.stripe.paymentIntents.create(IntentCreationParams);
  }
  stripeWebhook(req: Request): StripeConstructor.CheckoutSessionCompletedEvent {
    const event: StripeConstructor.Event = this.stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'] as string,
      this.configService.get<string>('STRIPE_HOOK_SECRET') as string,
    );

    if (event.type !== 'checkout.session.completed') {
      if (event.type === 'checkout.session.expired') {
        throw new BadRequestException('Payment link expired');
      }
      throw new BadRequestException('Failed to pay for your order');
    }
    return event;
  }
  async retrievePaymentIntent(intentId: string) {
    const retrievedIntentId =
      await this.stripe.paymentIntents.retrieve(intentId);
    if (!retrievedIntentId) {
      throw new NotFoundException("Couldn't find that specific payment intent");
    }
    return retrievedIntentId;
  }
  async confirmPaymentIntent(intentId: string) {
    const orderIntent = await this.retrievePaymentIntent(intentId);
    if (orderIntent.status !== 'requires_confirmation') {
      throw new BadRequestException(
        "This payment intent doesn't require confirmation",
      );
    }
    return await this.stripe.paymentIntents.confirm(intentId);
  }

  async handleOrderRefund(intentId: string) {
    const orderIntent = await this.retrievePaymentIntent(intentId);
    if (orderIntent.status !== 'succeeded') {
      throw new BadRequestException(`Payment intent retrieval failed`);
    }
    return await this.stripe.refunds.create({ payment_intent: intentId });
  }
}
