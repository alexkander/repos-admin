import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Folder } from '../schemas/folder.schema';

type CreateDto = {
  folderKey: string;
  forderPath: string;
};

@Injectable()
export class FolderRepository {
  constructor(
    @InjectModel(Folder.name) private readonly FolderModel: Model<Folder>,
  ) { }

  find(query?: FilterQuery<Folder>) {
    return this.FolderModel.find(query).lean();
  }

  async create(data: CreateDto) {
    return this.FolderModel.create(data);
  }

  deleteMany(filter?: FilterQuery<Folder>) {
    return this.FolderModel.deleteMany(filter);
  }
}
