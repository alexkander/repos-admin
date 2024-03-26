import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { glob } from 'glob';
import * as path from 'path';
import { FolderRepository } from '../repositories/folder.repository';
import { Folder } from '../schemas/folder.schema';
import { RepoConstants } from '../constants/repo.constants';
import { RepoRepository } from '../repositories/repo.repository';
import { GitRepoService } from './gitRepo.service';

@Injectable()
export class RepoService {
  constructor(
    private readonly repoRepository: RepoRepository,
    private readonly folderRepository: FolderRepository,
    private readonly gitRepoService: GitRepoService,
  ) { }

  list() {
    return this.repoRepository.find();
  }

  async saveLocalRepos() {
    await this.repoRepository.deleteMany();
    const localRepos = await this.listLocalRepos();
    const createPromises = localRepos.map((repo) => {
      return this.repoRepository.create(repo);
    });
    const records = Promise.all(createPromises);
    return records;
  }

  async listLocalRepos() {
    const directories = await this.folderRepository.find();
    const allFilesPromises = directories.map((folder) => {
      return this.getReposInDirectory(folder.forderPath, folder);
    });
    const allFiles = (await Promise.all(allFilesPromises)).flatMap((f) => f);

    return allFiles;
  }

  async getReposInDirectory(directory: string, folder: Folder) {
    const allSubDirectories = await this.getSubDirectories(directory);
    const subDirectories = allSubDirectories.filter((d) => {
      return !RepoConstants.ignoreDirectories.find((regex) => d.match(regex));
    });

    const reposPromises = subDirectories.map(async (subDirectory) => {
      const itemDirectory = path.resolve(directory, subDirectory);
      const gitDirectory = path.resolve(itemDirectory, '.git');
      if (fs.existsSync(gitDirectory)) {
        const directory = path.relative(folder.forderPath, itemDirectory);
        const group = path.dirname(directory);
        const localName = path.basename(directory);
        const { valid } = await this.gitRepoService.getRepoInfo(itemDirectory);
        const data = {
          folderKey: folder.folderKey,
          directory,
          group,
          localName,
          valid,
        };
        return [data];
      } else {
        return this.getReposInDirectory(itemDirectory, folder);
      }
    });

    const repos = (await Promise.all(reposPromises)).flatMap((f) => f);

    return repos;
  }

  async getSubDirectories(directory: string) {
    const subDirectories = await glob(RepoConstants.pattern, {
      cwd: directory,
    });
    return subDirectories;
  }
}
