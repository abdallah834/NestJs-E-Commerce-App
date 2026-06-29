import {
  AnyKeys,
  ApplyBasicCreateCasting,
  CreateOptions,
  DeepPartial,
  DeleteResult,
  FlattenMaps,
  HydratedDocument,
  Model,
  MongooseBaseQueryOptions,
  MongooseUpdateQueryOptions,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  Require_id,
  ReturnsNewDoc,
  Types,
  UpdateQuery,
  UpdateResult,
  UpdateWithAggregationPipeline,
} from 'mongoose';
import { IPaginate } from '../../common/interfaces';
import { Injectable } from '@nestjs/common';
// this import is required so that types get merged instead of completely overwritten

@Injectable()
export abstract class DataBaseRepo<TRawDoc> {
  constructor(protected readonly model: Model<TRawDoc>) {}
  // using overload to provide flexibility with using model methods
  ///////////////// Create
  async create({
    data,
  }: {
    data: AnyKeys<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc>>;
  async create({
    data,
    options,
  }: {
    data: AnyKeys<TRawDoc>[];
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>[]>;

  async create({
    data,
    options,
  }: {
    // AnyKeys<TRawDoc>
    // AnyKeys<TRawDoc>[]
    data: Array<DeepPartial<ApplyBasicCreateCasting<Require_id<TRawDoc>>>>;
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>[] | HydratedDocument<TRawDoc>> {
    return this.model.create(data, options);
  }
  async insertMany({
    data,
  }: {
    data: AnyKeys<TRawDoc>[];
  }): Promise<HydratedDocument<TRawDoc>[]> {
    return this.model.insertMany(data as HydratedDocument<TRawDoc>[]);
  }
  async createOne({
    data,
    options,
  }: {
    data: AnyKeys<TRawDoc>;
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>> {
    const [doc] = await this.create({ data: [data], options });
    return doc;
  }
  ///////////////// Find
  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDoc> | undefined;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean?: false }) | null | undefined;
  }): Promise<HydratedDocument<TRawDoc> | null>;
  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDoc> | undefined;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean?: true }) | null | undefined;
  }): Promise<FlattenMaps<TRawDoc> | null>;

  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDoc> | undefined;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: QueryOptions<TRawDoc> | null | undefined;
  }): Promise<HydratedDocument<TRawDoc> | FlattenMaps<TRawDoc> | null> {
    const doc = this.model.findOne(filter, projection);
    if (options?.populate) doc.populate(options.populate as PopulateOptions[]);
    if (options?.lean) doc.lean(options.lean);
    return await doc.exec();
  }
  async find({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDoc> | undefined;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: QueryOptions<TRawDoc> | null | undefined;
  }): Promise<HydratedDocument<TRawDoc>[]> {
    const doc = this.model.find(filter, projection);
    if (options?.populate) doc.populate(options.populate as PopulateOptions[]);
    if (options?.lean) doc.lean(options.lean);
    if (options?.skip) doc.skip(options.skip);
    if (options?.limit) doc.limit(options.limit);
    return await doc.exec();
  }
  async paginate({
    filter,
    projection,
    options = {},
    page = '0',
    limit = '3',
  }: {
    filter?: QueryFilter<TRawDoc> | undefined;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: QueryOptions<TRawDoc>;
    page?: number | string | undefined;
    limit?: number | string | undefined;
  }): Promise<IPaginate<TRawDoc>> {
    let count = -1;
    const pageInt = parseInt(page as string);
    const sizeInt = parseInt(limit as string);
    if (pageInt > 0) {
      options.skip = (pageInt - 1) * sizeInt;
      options.limit = sizeInt;
      count = await this.model.countDocuments({ filter });
    }
    const docs = await this.find({ filter: filter || {}, projection, options });
    return {
      docs,
      ...(pageInt > 0
        ? {
            currentPage: pageInt,
            limit: sizeInt,
            pages: Math.ceil(count / sizeInt),
          }
        : {}),
    };
  }
  ///////////////// FindById
  async findByID({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean?: false }) | null | undefined;
  }): Promise<HydratedDocument<TRawDoc> | null>;
  async findByID({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean?: true }) | null | undefined;
  }): Promise<FlattenMaps<TRawDoc> | null>;

  async findByID({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: QueryOptions<TRawDoc> | null | undefined;
  }): Promise<any> {
    const doc = this.model.findById(_id, projection);
    if (options?.populate) doc.populate(options.populate as PopulateOptions[]);
    if (options?.lean) doc.lean(options.lean);
    return await doc.exec();
  }
  ///////////////// Update
  async updateOne({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc> | UpdateWithAggregationPipeline;
    options?: MongooseUpdateQueryOptions<TRawDoc> | null;
  }): Promise<UpdateResult> {
    if (Array.isArray(update)) {
      return await this.model.updateOne(filter, update, {
        ...options,
        updatePipeline: true,
      });
    }
    return await this.model.updateOne(
      filter,
      { ...update, $inc: { __v: 1 } },
      options,
    );
  }
  async findOneAndUpdate({
    filter,
    update,
    options = { returnDocument: 'after' },
    populate = [],
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc>;
    options?: (QueryOptions<TRawDoc> & ReturnsNewDoc) | null | undefined;
    populate?: PopulateOptions[];
  }): Promise<HydratedDocument<TRawDoc> | null> {
    if (Array.isArray(update)) {
      return await this.model
        .findOneAndUpdate(filter, update, {
          ...options,
          updatePipeline: true,
        })
        .populate(populate);
    }
    return await this.model
      .findOneAndUpdate(filter, { ...update, $inc: { __v: 1 } }, options)
      .populate(populate);
  }
  async findByIdAndUpdate({
    _id,
    update,
    options,
  }: {
    _id: Types.ObjectId;
    update: UpdateQuery<TRawDoc> | UpdateQuery<TRawDoc>[];
    options?: QueryOptions<TRawDoc> | null | undefined;
  }): Promise<HydratedDocument<TRawDoc> | null> {
    const resolvedOptions = {
      returnDocument: 'after' as const,
      ...options,
      ...(Array.isArray(update) ? { updatePipeline: true } : {}),
    };

    return Array.isArray(update)
      ? await this.model.findByIdAndUpdate(
          _id,
          // updatePipeline does't have a direct $inc so we use { $set: { __v: { $add: ['$__v', 1] } } }
          [...update, { $set: { __v: { $add: ['$__v', 1] } } }],
          resolvedOptions,
        )
      : await this.model.findByIdAndUpdate(
          _id,
          { ...update, $inc: { __v: 1 } },
          resolvedOptions,
        );
  }
  async updateMany({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc> | UpdateWithAggregationPipeline;
    options?: MongooseUpdateQueryOptions<TRawDoc> | null;
  }): Promise<UpdateResult> {
    return await this.model.updateMany(
      filter,
      { ...update, $inc: { __v: 1 } },
      options,
    );
  }

  ///////////////// Delete
  async deleteOne({
    filter,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    options?: MongooseBaseQueryOptions;
  }): Promise<DeleteResult> {
    return await this.model.deleteOne(filter, options);
  }
  async findOneAndDelete({
    filter,
    options = { new: true },
  }: {
    filter?: QueryFilter<TRawDoc> | null;
    options?: QueryOptions<TRawDoc> | null | undefined;
  }): Promise<HydratedDocument<TRawDoc> | null> {
    return await this.model.findOneAndDelete(filter, options);
  }
  async findByIdAndDelete({
    _id,
    options = { new: true },
  }: {
    _id: Types.ObjectId;
    options?: (QueryOptions<TRawDoc> & ReturnsNewDoc) | null | undefined;
  }): Promise<HydratedDocument<TRawDoc> | null> {
    return await this.model.findByIdAndDelete(_id, options);
  }
  async deleteMany({
    filter,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    options?: MongooseBaseQueryOptions<TRawDoc>;
  }): Promise<DeleteResult> {
    return await this.model.deleteMany(filter, options);
  }
}
