import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Repo } from '../schemas/repo.schema';

@Injectable()
export class RepoRepository {
  constructor(
    @InjectModel(Repo.name) private readonly RepoModel: Model<Repo>,
  ) { }

  find(query?: FilterQuery<Repo>) {
    return this.RepoModel.find(query).lean();
  }

  getValidReposByFolderKey(folderKey: string) {
    return this.RepoModel.find({ folderKey }).lean();
  }

  async create(data: Repo) {
    return this.RepoModel.create(data);
  }

  deleteMany(filter?: FilterQuery<Repo>) {
    return this.RepoModel.deleteMany(filter);
  }
}
