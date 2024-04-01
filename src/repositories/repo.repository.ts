import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Repo } from '../schemas/repo.schema';
import { RepoRemotesInfo } from '../types/repos.types';

@Injectable()
export class RepoRepository {
  constructor(
    @InjectModel(Repo.name) private readonly RepoModel: Model<Repo>,
  ) { }

  findValidRepos() {
    return this.RepoModel.find({ valid: true }).lean();
  }

  findValidReposByFolderKey(folderKey: string) {
    return this.RepoModel.find({ folderKey, valid: true }).lean();
  }

  async create(data: Repo) {
    return this.RepoModel.create(data);
  }

  async updateRemotesById(id: Types.ObjectId, data: RepoRemotesInfo) {
    return this.RepoModel.updateOne({ _id: id }, data);
  }

  truncate() {
    return this.RepoModel.deleteMany();
  }
}
