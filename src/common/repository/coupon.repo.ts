import { Injectable } from '@nestjs/common';
import { DataBaseRepo } from './base.repo';
import { ICoupon } from '../interfaces';
import { Coupon } from 'src/models';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class CouponRepo extends DataBaseRepo<ICoupon> {
  constructor(
    @InjectModel(Coupon.name) protected readonly model: Model<ICoupon>,
  ) {
    super(model);
  }
}
