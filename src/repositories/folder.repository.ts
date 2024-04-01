import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Folder } from '../schemas/folder.schema';

@Injectable()
export class FolderRepository {
  constructor(
    @InjectModel(Folder.name) private readonly FolderModel: Model<Folder>,
  ) { }

  find(query?: FilterQuery<Folder>) {
    return this.FolderModel.find(query).lean();
  }

  findOneByKey(folderKey: string) {
    return this.FolderModel.findOne({ folderKey }).lean();
  }

  async create(data: Folder) {
    return this.FolderModel.create(data);
  }

  deleteMany(filter?: FilterQuery<Folder>) {
    return this.FolderModel.deleteMany(filter);
  }

  buildCache() {
    const cache: Record<string, Folder> = {};
    return async (key: string) => {
      if (cache[key]) {
        return cache[key];
      }
      const folder = await this.findOneByKey(key);
      cache[key] = folder;
      return cache[key];
    };
  }
}
