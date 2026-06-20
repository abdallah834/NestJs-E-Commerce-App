import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IBrand, ICategory, IUser } from 'src/common/interfaces';

export type hydratedCategoryDocument = HydratedDocument<ICategory>;
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: true,
  strictQuery: true,
})
//////////////////NestJs schema
export class Category implements ICategory {
  @Prop({
    type: String,
    required: true,
    unique: true,
    minLength: 2,
    maxLength: 50,
  })
  name!: string;
  @Prop({ type: String, maxLength: 15, minLength: 5 })
  slogan?: string | undefined;
  @Prop({ type: String, minLength: 2, maxLength: 50 })
  slug?: string;
  @Prop({ type: String, required: true })
  image!: string;
  @Prop({ type: [String] })
  slider?: string[];
  @Prop({ type: [String], required: true, ref: 'brands' })
  brandIds!: Types.ObjectId[] | IBrand[];
  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  createdBy!: Types.ObjectId | IUser;
  @Prop({ type: Types.ObjectId, ref: 'users' })
  updatedBy?: Types.ObjectId | IUser | undefined;
  @Prop({ type: Date })
  deletedAt?: Date;
  @Prop({ type: Date })
  restoredAt?: Date;
  @Prop({ type: Boolean, default: false })
  paranoid?: boolean;
}

//////////////////Mongoose schema
export const categoryMongoDBSchema = SchemaFactory.createForClass(Category);
// category model hooks

export const CategoryModel = MongooseModule.forFeatureAsync([
  {
    name: Category.name,

    useFactory: () => {
      //////////////////////// save
      categoryMongoDBSchema.pre(
        'save',
        function (this: HydratedDocument<ICategory> & { wasNew: boolean }) {
          this.wasNew = this.isNew;
          if (this.isModified('name')) {
            this.slug = this.name.replaceAll(/\s+/g, '-');
          }
        },
      );

      //////////////////////// Find
      categoryMongoDBSchema.pre(['findOne', 'find'], function () {
        //////// to check search query or filter
        // console.log(this.getFilter());
        const query = this.getFilter();
        if (query.paranoid === false) {
          this.setQuery({ ...query });
        }
        this.setQuery({ ...query, deletedAt: { $exists: false } });
      });
      //////////////////////// Update
      categoryMongoDBSchema.pre(['updateOne', 'findOneAndUpdate'], function () {
        //////// to check search query or filter

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
      categoryMongoDBSchema.pre(['deleteOne', 'findOneAndDelete'], function () {
        //////// to check search query or filter

        const query = this.getFilter();
        if (query.force) {
          this.setQuery({ ...query });
        } else {
          this.setQuery({ deletedAt: { $exists: true }, ...query });
        }
      });
      return categoryMongoDBSchema;
    },
  },
]);
