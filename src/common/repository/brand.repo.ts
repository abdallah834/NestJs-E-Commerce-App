import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand } from 'src/models';
import { IBrand } from '../interfaces';
import { DataBaseRepo } from './base.repo';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BrandRepo extends DataBaseRepo<IBrand> {
  constructor(
    @InjectModel(Brand.name) protected readonly model: Model<IBrand>,
  ) {
    super(model);
  }
}
