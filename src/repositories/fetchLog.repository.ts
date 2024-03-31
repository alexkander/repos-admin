import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { FetchLog } from '../schemas/fetchLog.schema';

@Injectable()
export class FetchLogRepository {
  constructor(
    @InjectModel(FetchLog.name) private readonly FetchLogModel: Model<FetchLog>,
  ) { }

  find(query?: FilterQuery<FetchLog>) {
    return this.FetchLogModel.find(query).lean();
  }

  async create(data: Omit<FetchLog, '_id'>) {
    return this.FetchLogModel.create(data);
  }

  deleteMany(filter?: FilterQuery<FetchLog>) {
    return this.FetchLogModel.deleteMany(filter);
  }
}
