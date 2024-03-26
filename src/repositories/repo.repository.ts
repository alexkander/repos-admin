import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Repo } from '../schemas/repo.schema';

type CreateDto = {
  base: string;
  dirname: string;
  basename: string;
  valid: boolean;
  error?: Record<string, any>;
};

@Injectable()
export class RepoRepository {
  constructor(
    @InjectModel(Repo.name) private readonly RepoModel: Model<Repo>,
  ) {}

  async create(data: CreateDto) {
    return this.RepoModel.create(data);
  }

  deleteMany(filter?: FilterQuery<Repo>) {
    return this.RepoModel.deleteMany(filter);
  }
}
