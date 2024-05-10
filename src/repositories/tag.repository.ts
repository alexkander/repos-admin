import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Tag } from 'src/schemas/tag.schema';
import { RepoFilterQuery } from 'src/types/remotes.type';

@Injectable()
export class TagRepository {
  constructor(@InjectModel(Tag.name) private readonly TagModel: Model<Tag>) { }

  async upsertByDirectoryAndLargeName(data: Tag) {
    const cond = { directory: data.directory, largeName: data.largeName };
    const record = await this.TagModel.findOne(cond);
    if (!record) {
      return (await this.TagModel.create({ ...data })).toJSON();
    }
    Object.assign(record, data);
    return (await record.save()).toJSON();
  }

  deleteByRemotesExcludingTagLargeNames({
    directory,
    remoteNames,
    excludeTagLargeNames,
  }: RepoFilterQuery & {
    remoteNames?: string[];
    excludeTagLargeNames: string[];
  }) {
    const filter: FilterQuery<Tag> = {
      directory,
      largeName: { $nin: excludeTagLargeNames },
    };
    if (remoteNames) {
      filter.remote = { $in: remoteNames };
    }
    return this.TagModel.deleteMany(filter);
  }
}
