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
    try {
      const gitRepo = simpleGit(directory);
      await gitRepo.log();
      return { valid: true };
    } catch (e) {
      return { error: e, valid: false };
    }
  }
}
