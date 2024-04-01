import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  HostGroupFilterQuery,
  RemoteFetchStatus,
  RemoteFilterQuery,
  RemoteTargetInfo,
  RepoFilterQuery,
} from '../types/remotes.type';
import { Remote } from '../schemas/remote.schema';

@Injectable()
export class RemoteRepository {
  constructor(
    @InjectModel(Remote.name) private readonly RemoteModel: Model<Remote>,
  ) { }

  all() {
    return this.RemoteModel.find().lean();
  }

  findOneInRepoByName(filter: RemoteFilterQuery) {
    return this.RemoteModel.findOne(filter).lean();
  }

  findSiblings(id: string, { folderKey, directory }: RepoFilterQuery) {
    return this.RemoteModel.find({
      id: { $ne: id },
      folderKey,
      directory,
    }).lean();
  }

  findByHostGroup({ targetHost, targetGroup }: HostGroupFilterQuery) {
    return this.RemoteModel.find({ targetHost, targetGroup }).lean();
  }

  findByDirectory(directory: string) {
    return this.RemoteModel.find({ directory }).lean();
  }

  async create(data: Remote) {
    return this.RemoteModel.create(data);
  }

  async updateTargetInfoById(id: Types.ObjectId, data: RemoteTargetInfo) {
    return this.RemoteModel.updateOne({ _id: id }, data);
  }

  async updateFetchInfo(filter: RemoteFilterQuery, data: RemoteFetchStatus) {
    return this.RemoteModel.updateMany(filter, data);
  }

  truncate() {
    return this.RemoteModel.deleteMany();
  }
}
