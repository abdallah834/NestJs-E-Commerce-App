import { BadRequestException } from '@nestjs/common';
import {
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
  Virtual,
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  GenderEnums,
  LanguageEnum,
  ProviderEnums,
  RoleEnums,
} from 'src/common/enums';
import { IUser } from 'src/common/interfaces';
import { SecurityModule } from 'src/common/services/security/security.module';
import { SecurityService } from 'src/common/services/security/security.service';

export type hydratedUserDocument = HydratedDocument<IUser>;
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: true,
  strictQuery: true,
})
//////////////////NestJs schema
export class User implements IUser {
  @Prop({ type: String, required: true })
  firstName!: string;
  @Prop({ type: String, required: true })
  lastName!: string;
  // this basically means whenever you try to set|update a new value to username field it uses the set function and when finding the value the get function is used
  @Virtual({
    set: function (this: hydratedUserDocument, value: string) {
      const [firstName, lastName] = value.split(' ') || [];
      return this.set({ firstName, lastName });
    },
    get: function (this: hydratedUserDocument) {
      return `${this.firstName} ${this.lastName}`;
    },
  })
  username?: string;
  @Prop({ type: String, required: true })
  email!: string;
  @Prop({
    type: String,
    required: function (this: hydratedUserDocument) {
      return this.provider === ProviderEnums.SYSTEM;
    },
  })
  password?: string;
  @Prop({ type: String })
  phone?: string;
  @Prop({ type: String })
  bio?: string;
  // @Prop({ type: [String] })
  // friends?: Types.ObjectId[] | IUser[];
  @Prop({ type: String, enum: LanguageEnum, default: LanguageEnum.EN })
  preferredLanguage?: LanguageEnum;
  @Prop({ type: [String] })
  coverImages?: string[];

  @Prop({ type: String })
  profileImage?: string;
  @Prop({ type: Date })
  DOB?: Date;
  @Prop({ type: Number, enum: ProviderEnums, default: ProviderEnums.SYSTEM })
  provider!: ProviderEnums;
  @Prop({ type: Number, enum: RoleEnums, default: RoleEnums.USER })
  role!: RoleEnums;
  @Prop({ type: Number, enum: GenderEnums, default: GenderEnums.MALE })
  gender!: GenderEnums;
  @Prop({ type: Date })
  confirmedAt?: Date;
  @Prop({ type: Date })
  deletedAt?: Date;
  @Prop({ type: Date })
  restoredAt?: Date;
  @Prop({ type: Date })
  changedCredentialsTime?: Date;
  @Prop({ type: Boolean, default: false })
  paranoid?: boolean;
}

//////////////////Mongoose schema
export const userMongoDBSchema = SchemaFactory.createForClass(User);
// user model hooks

export const UserModel = MongooseModule.forFeatureAsync([
  {
    name: User.name,
    imports: [SecurityModule],
    useFactory: (securityService: SecurityService) => {
      //////////////////////// save
      userMongoDBSchema.pre(
        'save',
        async function (this: HydratedDocument<IUser> & { wasNew: boolean }) {
          this.wasNew = this.isNew;
          if (this.isModified('password')) {
            this.password = await securityService.generateHash(
              this.password as string,
            );
          }

          if (this.phone && this.isModified('phone')) {
            this.phone = securityService.encrypt(this.phone);
          }
        },
      );
      userMongoDBSchema.pre('validate', function () {
        if (this.password && this.provider === ProviderEnums.GOOGLE) {
          throw new BadRequestException(
            "Google account shouldn't contain a password",
          );
        }
      });
      //////////////////////// Find
      userMongoDBSchema.pre(['findOne', 'find'], function () {
        //////// to check search query or filter
        // console.log(this.getFilter());
        const query = this.getFilter();
        if (query.paranoid === false) {
          this.setQuery({ ...query });
        }
        this.setQuery({ ...query, deletedAt: { $exists: false } });
      });
      //////////////////////// Update
      userMongoDBSchema.pre(['updateOne', 'findOneAndUpdate'], function () {
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
      userMongoDBSchema.pre(['deleteOne', 'findOneAndDelete'], function () {
        //////// to check search query or filter

        const query = this.getFilter();
        if (query.force) {
          this.setQuery({ ...query });
        } else {
          this.setQuery({ deletedAt: { $exists: true }, ...query });
        }
      });
      return userMongoDBSchema;
    },
    inject: [SecurityService],
  },
]);
