import {
  MongooseModule,
  Prop,
  raw,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ICart, ICartProduct, IUser } from 'src/common/interfaces';

export type hydratedCartDocument = HydratedDocument<ICart>;
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: true,
  strictQuery: true,
})
//////////////////NestJs schema
export class Cart implements ICart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  createdBy!: Types.ObjectId | IUser;
  @Prop([
    raw({
      productId: {
        type: Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: { type: Number, min: 1, required: true },
    }),
  ])
  products!: ICartProduct[];
}

//////////////////Mongoose schema
export const cartMongoDBSchema = SchemaFactory.createForClass(Cart);
// cart model hooks
export const CartModel = MongooseModule.forFeature([
  { name: Cart.name, schema: cartMongoDBSchema },
]);
