import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { CouponModel } from 'src/models';
import { CouponRepo } from 'src/common/repository/coupon.repo';
import { S3Service } from 'src/common/services';

@Module({
  imports: [CouponModel],
  controllers: [CouponController],
  providers: [CouponService, CouponRepo, S3Service],
})
export class CouponModule {}
