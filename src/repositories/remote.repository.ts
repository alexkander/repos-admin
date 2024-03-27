import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Remote } from '../schemas/remote.schema';

@Injectable()
export class RemoteRepository {
  constructor(
    @InjectModel(Remote.name) private readonly RemoteModel: Model<Remote>,
  ) { }

  find(query?: FilterQuery<Remote>) {
    return this.RemoteModel.find(query).lean();
  }

  async create(data: Remote) {
    return this.RemoteModel.create(data);
  }

  async update(id: Types.ObjectId, data: Remote) {
    return this.RemoteModel.updateOne({ _id: id }, data);
  }

  deleteMany(filter?: FilterQuery<Remote>) {
    return this.RemoteModel.deleteMany(filter);
  }
}
