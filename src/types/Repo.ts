import { Repository } from '../libs/nedb';

export class RepoModel {
  _id?: string = '';
  directory: string = '';
  group: string = '';
  localName: string = '';
  valid: boolean = false;
  remotes?: number;
  branches?: number;
  branchesToCheck?: number;
  tags?: number;
  tagsToCheck?: number;
}

export const RepoRepository = Repository.build(RepoModel);
