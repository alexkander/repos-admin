import { Injectable } from '@nestjs/common';
import { RepoHelper } from 'src/helpers/repo.helper';
import { RepoFilterQuery } from 'src/types/remotes.type';
import { GitService } from './git.service';

@Injectable()
export class TagsService {
  constructor(private readonly gitService: GitService) { }

  async listTags({ directory }: RepoFilterQuery) {
    const gitRepo = RepoHelper.getGitRepo(directory);
    // const tags = await gitRepo.listTags();
    return gitRepo.getTags();
  }
}
