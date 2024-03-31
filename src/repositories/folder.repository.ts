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

  async create(data: Omit<Folder, '_id'>) {
    return this.FolderModel.create(data);
  }

  deleteMany(filter?: FilterQuery<Folder>) {
    return this.FolderModel.deleteMany(filter);
  }
}
