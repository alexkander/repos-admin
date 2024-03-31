import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { RepoFilterQuery } from 'src/types/remotes.type';
import { Branch } from '../schemas/branch.schema';

@Injectable()
export class BranchRepository {
  constructor(
    @InjectModel(Branch.name) private readonly BranchModel: Model<Branch>,
  ) { }

  find(query?: FilterQuery<Branch>) {
    return this.BranchModel.find(query).lean();
  }

  findRepoBranches({ folderKey, directory }: RepoFilterQuery) {
    return this.BranchModel.find({
      folderKey,
      directory,
    }).lean();
  }

  async create(data: Omit<Branch, '_id'>) {
    return this.BranchModel.create(data);
  }

  deleteMany(filter?: FilterQuery<Branch>) {
    return this.BranchModel.deleteMany(filter);
  }
}
