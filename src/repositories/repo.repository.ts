import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { SortQueryData } from '../types/utils.types';
import { Repo } from '../schemas/repo.schema';
import { RepoFilterQuery } from '../types/remotes.type';

@Injectable()
export class RepoRepository {
  constructor(
    @InjectModel(Repo.name) private readonly RepoModel: Model<Repo>,
  ) { }

  findAll(query: FilterQuery<Repo>, sort: SortQueryData<Repo>) {
    return this.RepoModel.find(query, undefined, { sort }).lean();
  }

  findById(id: Types.ObjectId) {
    return this.RepoModel.findById(id).lean();
  }

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
