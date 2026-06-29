import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IBrand, ICategory, IProduct, IUser } from 'src/common/interfaces';

export type hydratedProductDocument = HydratedDocument<IProduct>;
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: true,
  strictQuery: true,
})
//////////////////NestJs schema
export class Product implements IProduct {
  @Prop({
    type: String,
    required: true,
    minLength: 2,
    maxLength: 100,
  })
  name!: string;
  @Prop({
    type: String,
    required: true,
    minLength: 20,
    maxLength: 300,
  })
  description!: string;
  @Prop([{ type: Types.ObjectId, ref: 'Brand', required: true }])
  brandId!: Types.ObjectId[] | IBrand[];
  @Prop([{ type: Types.ObjectId, ref: 'Category', required: true }])
  categoryId!: Types.ObjectId[] | ICategory[];
  @Prop({ type: Number, required: true, min: 0 })
  finalPrice!: number;
  @Prop({ type: Number, required: true, min: 0 })
  originalPrice!: number;
  @Prop({ type: Number, required: true, min: 0 })
  salePrice!: number;
  @Prop({ type: Number, required: true, min: 0, max: 300 })
  stock!: number;
  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  discountPercentage?: number;
  @Prop({ type: Number, min: 0, max: 5 })
  rating?: number;
  @Prop({ type: String, required: true, minLength: 4, maxLength: 6 })
  referenceId!: string;
  @Prop({ type: String, required: true })
  image!: string;
  @Prop({ type: String, minLength: 5, maxLength: 50 })
  slug?: string;
  @Prop({ type: [String] })
  gallery?: string[];
  // the reference always needs the name of the declared model in the code not in DB
  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  notifyUsers?: Types.ObjectId[] | IUser[] | undefined;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId | IUser;
  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId | IUser | undefined;
  @Prop({ type: Date })
  deletedAt?: Date;
  @Prop({ type: Date })
  restoredAt?: Date;
  @Prop({ type: Boolean, default: false })
  paranoid?: boolean;
}

//////////////////Mongoose schema
export const productMongoDBSchema = SchemaFactory.createForClass(Product);
// Product model hooks

export const ProductModel = MongooseModule.forFeatureAsync([
  {
    name: Product.name,
    useFactory: () => {
      //////////////////////// save
      productMongoDBSchema.pre(
        'save',
        function (this: HydratedDocument<IProduct> & { wasNew: boolean }) {
          this.wasNew = this.isNew;
          if (this.isModified('name')) {
            this.slug = this.name.replaceAll(/\s+/g, '-');
          }
        },
      );
      //////////////////////// Find
      productMongoDBSchema.pre(['findOne', 'find'], function () {
        //////// to check search query or filter
        // console.log(this.getFilter());
        const query = this.getFilter();
        if (query.paranoid === false) {
          this.setQuery({ ...query });
        }
        this.setQuery({ ...query, deletedAt: { $exists: false } });
      });
      //////////////////////// Update
      productMongoDBSchema.pre(['updateOne', 'findOneAndUpdate'], function () {
        const updateQuery = this.getUpdate() as HydratedDocument<IUser>;
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
      productMongoDBSchema.pre(['deleteOne', 'findOneAndDelete'], function () {
        const query = this.getFilter();
        if (query.force) {
          this.setQuery({ ...query });
        } else {
          this.setQuery({ deletedAt: { $exists: true }, ...query });
        }
      });
      return productMongoDBSchema;
    },
  },
]);
