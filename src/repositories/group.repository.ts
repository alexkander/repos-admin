import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group } from '../schemas/group.schema';

@Injectable()
export class GroupRepository {
  constructor(
    @InjectModel(Group.name) private readonly GroupModel: Model<Group>,
  ) { }

  async create(data: Group) {
    return this.GroupModel.create(data);
  }

  truncate() {
    return this.GroupModel.deleteMany();
  }
}
