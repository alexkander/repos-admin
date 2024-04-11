import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Branch } from '../schemas/branch.schema';
import { RepoFilterQuery } from '../types/remotes.type';

@Injectable()
export class BranchRepository {
  constructor(
    @InjectModel(Branch.name) private readonly BranchModel: Model<Branch>,
  ) { }

  findByRepo({ directory }: RepoFilterQuery) {
    return this.BranchModel.find({ directory }).lean();
  }

  async create(data: Branch) {
    return this.BranchModel.create(data);
  }

  async upsertByDirectoryAndLargeName(data: Branch) {
    const cond = { directory: data.directory, largeName: data.largeName };
    const record = await this.BranchModel.findOne(cond);
    if (!record) {
      return (await this.BranchModel.create({ ...data })).toJSON();
    }
    Object.assign(record, data);
    return (await record.save()).toJSON();
  }
}
