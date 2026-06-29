import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { Cart } from 'src/models';
import { ICart } from '../interfaces';
import { DataBaseRepo } from './base.repo';

@Injectable()
export class CartRepo extends DataBaseRepo<ICart> {
  constructor(@InjectModel(Cart.name) protected readonly model: Model<ICart>) {
    super(model);
  }
}
