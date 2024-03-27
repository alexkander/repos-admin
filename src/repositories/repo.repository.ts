import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Repo } from '../schemas/repo.schema';

@Injectable()
export class RepoRepository {
  constructor(
    @InjectModel(Repo.name) private readonly RepoModel: Model<Repo>,
  ) { }

  find(query?: FilterQuery<Repo>) {
    return this.RepoModel.find(query).lean();
  }

  getValidRepos() {
    return this.RepoModel.find({ valid: true }).lean();
  }

  getValidReposByFolderKey(folderKey: string) {
    return this.RepoModel.find({ folderKey, valid: true }).lean();
  }

  async create(data: Repo) {
    return this.RepoModel.create(data);
  }

  async update(id: Types.ObjectId, data: Repo) {
    return this.RepoModel.updateOne({ _id: id }, data);
  }

  deleteMany(filter?: FilterQuery<Repo>) {
    return this.RepoModel.deleteMany(filter);
  }
}
