import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Branch } from '../schemas/branch.schema';
import { RemoteFilterQuery, RepoFilterQuery } from '../types/remotes.type';

@Injectable()
export class BranchRepository {
  constructor(
    @InjectModel(Branch.name) private readonly BranchModel: Model<Branch>,
  ) { }

  findById(id: Types.ObjectId) {
    return this.BranchModel.findById(id).lean();
  }

  findByRepo({ directory }: RepoFilterQuery) {
    return this.BranchModel.find({ directory }).lean();
  }

  findByRemote({ directory, name: remote }: RemoteFilterQuery) {
    return this.BranchModel.find({ directory, remote }).lean();
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

  deleteByRepoExcludingBranchLargeNames({
    directory,
    excludeBranchLargeNames,
  }: RepoFilterQuery & { excludeBranchLargeNames: string[] }) {
    return this.BranchModel.deleteMany({
      directory,
      largeName: { $nin: excludeBranchLargeNames },
    });
  }
}
