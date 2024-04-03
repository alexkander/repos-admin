import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Repo } from '../schemas/repo.schema';
import { RepoFilterQuery } from 'src/types/remotes.type';

@Injectable()
export class RepoRepository {
  constructor(
    @InjectModel(Repo.name) private readonly RepoModel: Model<Repo>,
  ) { }

  findOneByRepo({ directory, folderKey }: RepoFilterQuery) {
    return this.RepoModel.findOne({ directory, folderKey, valid: true }).lean();
  }

  findValidRepos() {
    return this.RepoModel.find({ valid: true }).lean();
  }

  findValidReposByFolderKey(folderKey: string) {
    return this.RepoModel.find({ folderKey, valid: true }).lean();
  }

  async create(data: Repo) {
    return this.RepoModel.create(data);
  }

  truncate() {
    return this.RepoModel.deleteMany();
  }
}
