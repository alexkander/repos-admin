import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Remote } from 'src/schemas/remote.schema';

type CreateDto = {
  folderKey: string;
  directory: string;
  name: string;
  url: string;
  rare: boolean;
  refs: Record<string, any>;
};

@Injectable()
export class RemoteRepository {
  constructor(
    @InjectModel(Remote.name) private readonly RemoteModel: Model<Remote>,
  ) { }

  find(query?: FilterQuery<Remote>) {
    return this.RemoteModel.find(query).lean();
  }

  async create(data: CreateDto) {
    return this.RemoteModel.create(data);
  }

  deleteMany(filter?: FilterQuery<Remote>) {
    return this.RemoteModel.deleteMany(filter);
  }
}
