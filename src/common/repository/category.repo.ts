import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DataBaseRepo } from './base.repo';
import { ICategory } from '../interfaces';
import { Category } from 'src/models';

@Injectable()
export class CategoryRepo extends DataBaseRepo<ICategory> {
  constructor(
    @InjectModel(Category.name) protected readonly model: Model<ICategory>,
  ) {
    super(model);
  }
}
