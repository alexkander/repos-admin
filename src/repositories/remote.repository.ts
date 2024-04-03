import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Remote } from '../schemas/remote.schema';
import {
  HostGroupFilterQuery,
  RemoteFetchStatus,
  RemoteFilterQuery,
  RepoFilterQuery,
} from '../types/remotes.type';

@Injectable()
export class RemoteRepository {
  constructor(
    @InjectModel(Remote.name) private readonly RemoteModel: Model<Remote>,
  ) { }

  all() {
    return this.RemoteModel.find().lean();
  }

  findByRepo({ directory, folderKey }: RepoFilterQuery) {
    return this.RemoteModel.find({ directory, folderKey }).lean();
  }

  findOneInRepoByName({ directory, folderKey, name }: RemoteFilterQuery) {
    return this.RemoteModel.findOne({ directory, folderKey, name }).lean();
  }

  findByHostGroup({ targetHost, targetGroup }: HostGroupFilterQuery) {
    return this.RemoteModel.find({ targetHost, targetGroup }).lean();
  }

  async create(data: Remote) {
    return this.RemoteModel.create(data);
  }

  async updateById(_id: Types.ObjectId, data: Remote) {
    return this.RemoteModel.updateOne({ _id }, data);
  }

  async updateFetchInfo(
    filter: RemoteFilterQuery,
    { fetchResult, fetchStatus }: RemoteFetchStatus,
  ) {
    return this.RemoteModel.updateMany(filter, { fetchResult, fetchStatus });
  }

  truncate() {
    return this.RemoteModel.deleteMany();
  }
}
