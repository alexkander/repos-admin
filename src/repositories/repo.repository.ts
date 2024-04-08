import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Repo } from '../schemas/repo.schema';
import { RepoFilterQuery } from '../types/remotes.type';
import { SortQueryData } from '../types/utils.types';

@Injectable()
export class RepoRepository {
  constructor(
    @InjectModel(Repo.name) private readonly RepoModel: Model<Repo>,
  ) { }

  count() {
    return this.RepoModel.countDocuments();
  }

  findAll(query: FilterQuery<Repo>, sort: SortQueryData<Repo>) {
    return this.RepoModel.find(query, undefined, { sort }).lean();
  }

  findById(id: Types.ObjectId) {
    return this.RepoModel.findById(id).lean();
  }

  findOneByRepo({ directory }: RepoFilterQuery) {
    return this.RepoModel.findOne({ directory, valid: true }).lean();
  }

  findValidRepos() {
    return this.RepoModel.find({ valid: true }).lean();
  }

  async create(data: Repo) {
    return this.RepoModel.create(data);
  }

  async upsertByDirectory(data: Repo) {
    const cond = { directory: data.directory };
    const record = await this.RepoModel.findOne(cond);
    if (!record) {
      return (await this.RepoModel.create({ ...data })).toJSON();
    }
    Object.assign(record, data);
    return (await record.save()).toJSON();
  }

  truncate() {
    return this.RepoModel.deleteMany();
  }
}
