import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from 'src/models';
import { IOrder } from '../interfaces';
import { DataBaseRepo } from './base.repo';

@Injectable()
export class OrderRepo extends DataBaseRepo<IOrder> {
  constructor(
    @InjectModel(Order.name) protected readonly model: Model<IOrder>,
  ) {
    super(model);
  }
}
