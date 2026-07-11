import { S3ServiceException } from '@aws-sdk/client-s3';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ICoupon, IMulterFile } from 'src/common/interfaces';
import { CouponRepo } from 'src/common/repository/coupon.repo';
import { S3Service } from 'src/common/services';
import { hydratedUserDocument } from 'src/models';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class CouponService {
  constructor(
    private readonly couponRepo: CouponRepo,
    private readonly s3Service: S3Service,
  ) {}
  async create(
    {
      discount,
      couponName,
      couponType,
      endDate,
      startDate,
      usageAmount,
    }: CreateCouponDto,
    user: hydratedUserDocument,
    file: IMulterFile,
  ): Promise<ICoupon> {
    try {
      const checkExistingCoupon = await this.couponRepo.findOne({
        filter: { couponName, paranoid: false },
      });
      if (checkExistingCoupon) {
        throw new ConflictException('A coupon with this name already exists');
      }
      const couponImage =
        file &&
        (await this.s3Service.uploadAsset({
          file,
          path: 'Coupons',
        }));
      const createdCoupon = await this.couponRepo.createOne({
        data: {
          image: couponImage,
          createdBy: user._id,
          couponName,
          startDate,
          endDate,
          couponType,
          discount,
          usageAmount,
        },
      });
      if (!createdCoupon) {
        if (couponImage) {
          await this.s3Service.deleteAsset({ Key: couponImage });
        }
        throw new BadRequestException('Failed to create coupon');
      }
      return createdCoupon.toJSON();
    } catch (error) {
      if (error instanceof S3ServiceException) {
        throw new BadRequestException('AWS file upload error');
      }
      throw error;
    }
  }

  findAll() {
    return `This action returns all coupon`;
  }

  findOne(id: number) {
    return `This action returns a #${id} coupon`;
  }

  update(
    id: number,
    // updateCouponDto: UpdateCouponDto
  ) {
    return `This action updates a #${id} coupon with`;
  }

  remove(id: number) {
    return `This action removes a #${id} coupon`;
  }
}
