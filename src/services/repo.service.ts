import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { glob } from 'glob';
import * as path from 'path';
import simpleGit from 'simple-git';
import { configuration } from '../configuration/configuration';
import { RepoConstants } from '../constants/repo.constants';
import { RepoRepository } from '../repositories/repo.repository';

@Injectable()
export class RepoService {
  constructor(private readonly repoRepository: RepoRepository) {}

  async saveLocalRepos() {
    await this.repoRepository.deleteMany();
    const localRepos = await this.listLocalRepos();
    const createPromises = localRepos.map((repo) => {
      return this.repoRepository.create(repo);
    });
    const records = Promise.all(createPromises);
    return records;
  }

  listDirectories() {
    return configuration.REPOSITORIES_DIRECTORIES.map((d) =>
      path.resolve(d.trim()),
    );
  }

  async listLocalRepos() {
    const directories = this.listDirectories();
    const allFilesPromises = directories.map((d) => {
      return this.getReposInDirectory(d, d);
    });
    const allFiles = (await Promise.all(allFilesPromises)).flatMap((f) => f);

    return allFiles;
  }

  async getReposInDirectory(directory: string, baseDirectory: string) {
    const allSubDirectories = await this.getSubDirectories(directory);
    const subDirectories = allSubDirectories.filter((d) => {
      return !RepoConstants.ignoreDirectories.find((regex) => d.match(regex));
    });

    const reposPromises = subDirectories.map(async (subDirectory) => {
      const itemDirectory = path.resolve(directory, subDirectory);
      const gitDirectory = path.resolve(itemDirectory, '.git');
      if (fs.existsSync(gitDirectory)) {
        const repo = path.relative(baseDirectory, itemDirectory);
        const dirname = path.dirname(repo);
        const basename = path.basename(repo);
        const { valid, error } = await this.getRepoInfo(itemDirectory);
        const data = { base: baseDirectory, dirname, basename, valid, error };
        return [data];
      } else {
        return this.getReposInDirectory(itemDirectory, baseDirectory);
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

  async getRepoInfo(directory: string) {
    try {
      const gitRepo = simpleGit(directory);
      await gitRepo.log();
      return { gitRepo, valid: true };
    } catch (e) {
      console.log('e', e);
      return { error: e, valid: false };
    }
  }
}
