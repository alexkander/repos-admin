import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { BranchFilterByLargeNameQuery } from 'src/types/branch.type';
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

  findByRemote({ directory, name: remoteName }: RemoteFilterQuery) {
    return this.BranchModel.find({ directory, remoteName }).lean();
  }

  findByRepoAndLargeName({
    directory,
    largeName,
  }: BranchFilterByLargeNameQuery) {
    return this.BranchModel.findOne({ directory, largeName }).lean();
  }

  deleteById(id: Types.ObjectId) {
    return this.BranchModel.deleteOne({ _id: id }).lean();
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

  deleteByRemote({ directory, name: remoteName }: RemoteFilterQuery) {
    return this.BranchModel.deleteMany({ directory, remoteName });
  }

  deleteByRemotesExcludingBranchLargeNames({
    directory,
    remoteNames,
    excludeBranchLargeNames,
  }: RepoFilterQuery & {
    remoteNames?: string[];
    excludeBranchLargeNames: string[];
  }) {
    const filter: FilterQuery<Branch> = {
      directory,
      largeName: { $nin: excludeBranchLargeNames },
    };
    if (remoteNames) {
      filter.remoteName = { $in: remoteNames };
    }
    return this.BranchModel.deleteMany(filter);
  }
}
