import { Injectable } from '@nestjs/common';
import { IProduct } from '../interfaces';
import { DataBaseRepo } from './base.repo';
import { Product } from 'src/models';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
@Injectable()
export class ProductRepo extends DataBaseRepo<IProduct> {
  constructor(
    @InjectModel(Product.name) protected readonly model: Model<IProduct>,
  ) {
    super(model);
  }
}
