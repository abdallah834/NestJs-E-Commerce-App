import {
  MongooseModule,
  Prop,
  raw,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CouponTypeEnum } from 'src/common/enums/coupon.enum';
import { ICoupon, IUser } from 'src/common/interfaces';

export type hydratedCouponDocument = HydratedDocument<ICoupon>;
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: true,
  strictQuery: true,
})
//////////////////NestJs schema
export class Coupon implements ICoupon {
  @Prop({
    type: String,
    required: true,
    unique: true,
    minLength: 2,
    maxLength: 50,
  })
  couponName!: string;
  @Prop({
    type: Number,
    enum: CouponTypeEnum,
    default: CouponTypeEnum.PERCENTAGE,
  })
  couponType!: CouponTypeEnum;
  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  discount!: number;
  @Prop({ type: Number, min: 1, max: 5, default: 1 })
  usageAmount!: number;
  @Prop({ type: Date, required: true })
  startDate!: Date;
  @Prop({ type: Date, required: true })
  endDate!: Date;
  @Prop({
    type: [
      raw({
        userId: { type: Types.ObjectId, ref: 'User', required: true },
        orderId: { type: Types.ObjectId, ref: 'Order', required: true },
        usedAt: { type: Date, required: true },
      }),
    ],
    required: false,
  })
  usedBy?:
    | { userId: Types.ObjectId; orderId: Types.ObjectId; usedAt: Date }[]
    | undefined;
  @Prop({ type: String, minLength: 2, maxLength: 50 })
  slug?: string;
  @Prop({ type: String })
  image!: string;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId | string | IUser;
  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId | string | IUser;
  @Prop({ type: Date })
  deletedAt?: Date;
  @Prop({ type: Date })
  restoredAt?: Date;
  @Prop({ type: Boolean, default: false })
  paranoid?: boolean;
}

//////////////////Mongoose schema
export const couponMongoDBSchema = SchemaFactory.createForClass(Coupon);
// Coupon model hooks

export const CouponModel = MongooseModule.forFeatureAsync([
  {
    name: Coupon.name,

    useFactory: () => {
      //////////////////////// save
      couponMongoDBSchema.pre(
        'save',
        function (this: hydratedCouponDocument & { wasNew: boolean }) {
          this.wasNew = this.isNew;
          if (this.isModified('couponName')) {
            this.slug = this.couponName.replaceAll(/\s+/g, '-');
          }
        },
      );

      //////////////////////// Find
      couponMongoDBSchema.pre(['findOne', 'find'], function () {
        //////// to check search query or filter
        // console.log(this.getFilter());
        const query = this.getFilter();
        if (query.paranoid === false) {
          this.setQuery({ ...query });
        }
        this.setQuery({ ...query, deletedAt: { $exists: false } });
      });
      //////////////////////// Update
      couponMongoDBSchema.pre(['updateOne', 'findOneAndUpdate'], function () {
        //////// to check search query or filter

        const updateQuery = this.getUpdate() as hydratedCouponDocument;
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
      couponMongoDBSchema.pre(['deleteOne', 'findOneAndDelete'], function () {
        //////// to check search query or filter

        const query = this.getFilter();
        if (query.force) {
          this.setQuery({ ...query });
        } else {
          this.setQuery({ deletedAt: { $exists: true }, ...query });
        }
      });
      return couponMongoDBSchema;
    },
  },
]);
