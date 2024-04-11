import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Remote } from '../schemas/remote.schema';
import {
  HostGroupFilterQuery,
  RemoteFetchStatus,
  RemoteFilterQuery,
  RemoteGroupType,
  RepoFilterQuery,
} from '../types/remotes.type';
import { SortQueryData } from '../types/utils.types';

@Injectable()
export class RemoteRepository {
  constructor(
    @InjectModel(Remote.name) private readonly RemoteModel: Model<Remote>,
  ) { }

  count() {
    return this.RemoteModel.countDocuments();
  }

  all() {
    return this.RemoteModel.find().lean();
  }

  findAll(query: FilterQuery<Remote>, sort: SortQueryData<Remote> = {}) {
    return this.RemoteModel.find(query, undefined, { sort }).lean();
  }

  findById(id: Types.ObjectId) {
    return this.RemoteModel.findById(id).lean();
  }

  findByRemoteGroup(group: RemoteGroupType) {
    const condition = this.getRemoteGroupCondition(group);
    return this.RemoteModel.find(condition);
  }

  getRemoteGroupCondition(group: RemoteGroupType) {
    if (group === 'all') {
      return {};
    } else if (group === 'fetchStatusError') {
      return { fetchStatus: 'error' };
    } else if (group === 'notFetched') {
      return { fetchStatus: { $exists: false } };
    }
    throw new BadRequestException(`unknown type: ${group}`);
  }

  findByRepo({ directory }: RepoFilterQuery) {
    return this.RemoteModel.find({ directory }).lean();
  }

  findOneInRepoByName({ directory, name }: RemoteFilterQuery) {
    return this.RemoteModel.findOne({ directory, name }).lean();
  }

  findByHostGroup({ targetHost, targetGroup }: HostGroupFilterQuery) {
    return this.RemoteModel.find({ targetHost, targetGroup }).lean();
  }

  async upsertByDirectoryAndName(data: Remote) {
    const cond = { directory: data.directory, name: data.name };
    const record = await this.RemoteModel.findOne(cond);
    if (!record) {
      return (await this.RemoteModel.create({ ...data })).toJSON();
    }
    Object.assign(record, data);
    return (await record.save()).toJSON();
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
}
