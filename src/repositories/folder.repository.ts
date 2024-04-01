import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Folder } from '../schemas/folder.schema';

@Injectable()
export class FolderRepository {
  constructor(
    @InjectModel(Folder.name) private readonly FolderModel: Model<Folder>,
  ) { }

  all() {
    return this.FolderModel.find().lean();
  }

  findOneByKey(folderKey: string) {
    return this.FolderModel.findOne({ folderKey }).lean();
  }

  async create(data: Folder) {
    return this.FolderModel.create(data);
  }

  truncate() {
    return this.FolderModel.deleteMany();
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
