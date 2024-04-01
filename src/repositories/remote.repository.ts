import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { HostGroupFilterQuery, RemoteFetchStatus, RemoteFilterQuery, RepoFilterQuery } from 'src/types/remotes.type';
import { Remote } from '../schemas/remote.schema';

@Injectable()
export class RemoteRepository {
  constructor(
    @InjectModel(Remote.name) private readonly RemoteModel: Model<Remote>,
  ) { }

  find(query?: FilterQuery<Remote>) {
    return this.RemoteModel.find(query).lean();
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

  async create(data: Remote) {
    return this.RemoteModel.create(data);
  }

  async update(id: Types.ObjectId, data: Remote) {
    return this.RemoteModel.updateOne({ _id: id }, data);
  }

  async updateFetchInfo(filter: RemoteFilterQuery, data: RemoteFetchStatus) {
    return this.RemoteModel.updateMany(filter, data);
  }

  deleteMany(filter?: FilterQuery<Remote>) {
    return this.RemoteModel.deleteMany(filter);
  }

  findByDirectory(directory: string) {
    return this.RemoteModel.find({ directory }).lean();
  }
}
