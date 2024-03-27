import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { glob } from 'glob';
import { FolderRepository } from '../repositories/folder.repository';
import { Folder } from '../schemas/folder.schema';
import { RepoConstants } from '../constants/repo.constants';
import { RepoRepository } from '../repositories/repo.repository';
import { GitRepoService } from './gitRepo.service';
import { RemoteRepository } from '../repositories/remote.repository';
import { routes } from '../utils/routes';

@Injectable()
export class RepoService {
  constructor(
    private readonly repoRepository: RepoRepository,
    private readonly remoteRepository: RemoteRepository,
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
      const itemDirectory = routes.resolve(directory, subDirectory);
      const gitDirectory = routes.resolve(itemDirectory, '.git');
      if (fs.existsSync(gitDirectory)) {
        const directory = routes.relative(folder.forderPath, itemDirectory);
        const group = routes.dirname(directory);
        const localName = routes.basename(directory);
        const repo = this.gitRepoService.getRepoFrom(
          folder.forderPath,
          directory,
        );
        const valid = await repo.isRepo();
        const data = {
          folderKey: folder.folderKey,
          directory,
          group,
          localName,
          valid,
          remotes: 0,
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
    return subDirectories.map((subDir) => {
      return subDir.split('\\').join('/');
    });
  }

  async countRemotes() {
    const repos = await this.repoRepository.getValidRepos();
    const updatePromises = repos.map(async (repo) => {
      const remotes = await this.remoteRepository.listByDirectory(
        repo.directory,
      );
      repo.remotes = remotes.length;
      return this.repoRepository.update(repo._id, repo);
    });
    const result = await Promise.all(updatePromises);
    return result;
  }
}
