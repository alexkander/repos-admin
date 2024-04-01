import { Injectable } from '@nestjs/common';
import { GitRepo } from '../types/gitRepo.class';

@Injectable()
export class GitRepoService {
  getRepoFrom(folderPath: string, directory: string) {
    return new GitRepo(folderPath, directory);
  }
}
