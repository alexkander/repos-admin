import { Tag } from 'src/schemas/tag.schema';
import { GitTagType } from '../types/gitRepo.types';

export class TagHelper {
  constructor() { }

  static gitTagToTag({
    gitTag,
    directory,
  }: {
    gitTag: GitTagType;
    directory: string;
  }): Tag {
    return {
      directory,
      ...gitTag,
    };
  }
}
