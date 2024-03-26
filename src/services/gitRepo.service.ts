import { Injectable } from '@nestjs/common';
import * as path from 'path';
import simpleGit from 'simple-git';

@Injectable()
export class GitRepoService {
  getRepoFrom(folderPath: string, directory: string) {
    const directoryPath = path.join(folderPath, directory);
    return simpleGit(directoryPath);
  }

  async getRepoInfo(directory: string) {
    const gitRepo = simpleGit(directory);
    const valid = await gitRepo.checkIsRepo();
    return { valid };
  }
}
