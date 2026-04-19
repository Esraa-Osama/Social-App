//~ Assignment 15 ~//

import {
  HydratedDocument,
  Model,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  Types,
  UpdateQuery,
} from "mongoose";

abstract class BaseRepository<TDocument> {
  protected readonly _model: Model<TDocument>;
  constructor(model: Model<TDocument>) {
    this._model = model;
  }

  async create(data: Partial<TDocument>): Promise<HydratedDocument<TDocument>> {
    return await this._model.create(data);
  }

  async findById(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<TDocument> | null> {
    return this._model.findById(id);
  }

  async findOne({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TDocument>;
    projection?: ProjectionType<TDocument>;
    options?: QueryOptions<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> {
    return this._model.findOne(filter, projection, options);
  }

  async find({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TDocument>;
    projection?: ProjectionType<TDocument>;
    options?: QueryOptions<TDocument>;
  }): Promise<HydratedDocument<TDocument>[] | []> {
    return this._model
      .find(filter, projection)
      .sort(options?.sort)
      .skip(options?.skip!)
      .limit(options?.limit!)
      .populate(options?.populate as PopulateOptions);
  }

  async findByIdAndUpdate({
    id,
    updates,
    options,
  }: {
    id: Types.ObjectId;
    updates: UpdateQuery<TDocument>;
    options?: QueryOptions<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> {
    return this._model.findByIdAndUpdate(id, updates, {
      new: true,
      ...options,
    });
  }

  async findOneAndUpdate({
    filter,
    updates,
    options,
  }: {
    filter: QueryFilter<TDocument>;
    updates: UpdateQuery<TDocument>;
    options?: QueryOptions<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> {
    return this._model.findOneAndUpdate(filter, updates, {
      new: true,
      ...options,
    });
  }

  async findOneAndDelete({
    filter,
    options,
  }: {
    filter: QueryFilter<TDocument>;
    options?: QueryOptions<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> {
    return this._model.findOneAndDelete(filter, {
      new: true,
      ...options,
    });
  }
}

export default BaseRepository;
