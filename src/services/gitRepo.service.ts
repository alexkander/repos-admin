import { Injectable } from '@nestjs/common';
import { GitRepo } from 'src/types/gitRepo.class';

@Injectable()
export class GitRepoService {
  getRepoFrom(folderPath: string, directory: string) {
    return new GitRepo(folderPath, directory);
  }
}
