import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/models';
import { IUser } from '../../common/interfaces';
import { DataBaseRepo } from './base.repo';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepo extends DataBaseRepo<IUser> {
  constructor(@InjectModel(User.name) protected readonly model: Model<IUser>) {
    super(model);
  }
}
