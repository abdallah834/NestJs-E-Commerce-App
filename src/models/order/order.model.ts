import {
  MongooseModule,
  Prop,
  raw,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  CurrencyTypeEnum,
  OrderStatusEnum,
  PaymentTypeEnum,
} from 'src/common/enums';
import {
  ICoupon,
  IOrder,
  IOrderedProducts,
  IUser,
} from 'src/common/interfaces';

export type hydratedOrderDocument = HydratedDocument<IOrder>;
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: true,
  strictQuery: true,
})
//////////////////NestJs schema
export class Order implements IOrder {
  @Prop({ type: String, required: true, minLength: 10, maxLength: 250 })
  address!: string;
  @Prop({ type: String, required: true, minLength: 11, maxLength: 11 })
  phoneNumber!: string;
  @Prop({ type: String, required: true, unique: true })
  orderId!: string;
  @Prop({ type: Types.ObjectId, ref: 'Coupon' })
  couponId?: Types.ObjectId | ICoupon;
  @Prop({ type: String })
  intentId?: string | undefined;
  @Prop({ type: String })
  note?: string | undefined;
  @Prop({
    type: raw({
      userId: { type: Types.ObjectId, ref: 'User', required: true },
      canceledAt: { type: Date, required: true },
      note: { type: String },
    }),
    required: false,
  })
  canceledBy?:
    | { userId: Types.ObjectId | IUser; canceledAt: Date; note?: string }
    | undefined;
  @Prop({
    type: [
      raw({
        productId: { type: Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitAmount: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
      }),
    ],
    required: true,
  })
  products!: IOrderedProducts[];
  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  discountPercentage?: number;
  @Prop({ type: String, enum: CurrencyTypeEnum, default: CurrencyTypeEnum.EGP })
  currency!: CurrencyTypeEnum;
  @Prop({ type: Number, enum: PaymentTypeEnum, default: PaymentTypeEnum.CASH })
  paymentType!: PaymentTypeEnum;
  @Prop({
    type: Number,
    enum: OrderStatusEnum,
    default: OrderStatusEnum.PENDING,
  })
  status?: OrderStatusEnum;
  @Prop({ type: Date })
  paidAt?: Date;
  @Prop({ type: Date })
  refundedAt?: Date;
  @Prop({ type: Number, min: 0, default: 0, required: true })
  subTotal!: number;
  @Prop({ type: Number, min: 0, default: 0, required: true })
  total!: number;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId | IUser;
  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId | IUser;
  @Prop({ type: Date })
  deletedAt?: Date;
  @Prop({ type: Date })
  restoredAt?: Date;
  @Prop({ type: Boolean, default: false })
  paranoid?: boolean;
}

//////////////////Mongoose schema
export const orderMongoDBSchema = SchemaFactory.createForClass(Order);
// order model hooks

export const OrderModel = MongooseModule.forFeatureAsync([
  {
    name: Order.name,

    useFactory: () => {
      //////////////////////// Find
      orderMongoDBSchema.pre(['findOne', 'find'], function () {
        //////// to check search query or filter
        // console.log(this.getFilter());
        const query = this.getFilter();
        if (query.paranoid === false) {
          this.setQuery({ ...query });
        }
        this.setQuery({ ...query, deletedAt: { $exists: false } });
      });
      //////////////////////// Update
      orderMongoDBSchema.pre(['updateOne', 'findOneAndUpdate'], function () {
        //////// to check search query or filter

        const updateQuery = this.getUpdate() as hydratedOrderDocument;
        if (updateQuery.deletedAt) {
          this.setUpdate({ ...updateQuery, $unset: { restoredAt: 1 } });
        }
        if (updateQuery.restoredAt) {
          this.setUpdate({ ...updateQuery, $unset: { deletedAt: 1 } });
          this.setQuery({ ...this.getQuery(), deletedAt: { $exists: true } });
        }
        const query = this.getFilter();
        if (query.paranoid === false) {
          this.setQuery({ ...query });
        } else {
          this.setQuery({ deletedAt: { $exists: false }, ...query });
        }
      });

      //////////////////////// Delete
      orderMongoDBSchema.pre(['deleteOne', 'findOneAndDelete'], function () {
        //////// to check search query or filter

        const query = this.getFilter();
        if (query.force) {
          this.setQuery({ ...query });
        } else {
          this.setQuery({ deletedAt: { $exists: true }, ...query });
        }
      });
      return orderMongoDBSchema;
    },
  },
]);
