import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Group } from '../schemas/group.schema';

@Injectable()
export class GroupRepository {
  constructor(
    @InjectModel(Group.name) private readonly GroupModel: Model<Group>,
  ) { }

  find(query?: FilterQuery<Group>) {
    return this.GroupModel.find(query).lean();
  }

  async create(data: Group) {
    return this.GroupModel.create(data);
  }

  deleteMany(filter?: FilterQuery<Group>) {
    return this.GroupModel.deleteMany(filter);
  }
}
