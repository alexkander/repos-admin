import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Branch } from '../schemas/branch.schema';

@Injectable()
export class BranchRepository {
  constructor(
    @InjectModel(Branch.name) private readonly BranchModel: Model<Branch>,
  ) { }

  find(query?: FilterQuery<Branch>) {
    return this.BranchModel.find(query).lean();
  }

  async create(data: Branch) {
    return this.BranchModel.create(data);
  }

  deleteMany(filter?: FilterQuery<Branch>) {
    return this.BranchModel.deleteMany(filter);
  }
}
