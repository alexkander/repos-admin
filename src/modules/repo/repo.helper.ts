import * as fs from 'fs';
import { glob } from 'glob';

import { configuration } from '../../configuration';
import { RoutesUtils } from '../../libs/routes-utils';
import { GitRepo } from '../git-utils/git-repo.class';
import { RepoConstants } from './repo.constants';
import { RepoModel } from './repo.model';

export class RepoHelper {
  public static readonly baseDirectory = RoutesUtils.resolve(configuration.REPOSITORIES_DIRECTORY);

  static getGitRepo(directory: string) {
    const gitDirectory = RoutesUtils.resolve(this.baseDirectory, directory);
    if (!gitDirectory.startsWith(this.baseDirectory)) {
      throw new Error('repository not found');
    }
    return new GitRepo(gitDirectory);
  }

  static async getRepoDataFromDirectory(directory: string) {
    const group = RoutesUtils.dirname(directory);
    const localName = RoutesUtils.basename(directory);
    const gitRepo = this.getGitRepo(directory);
    const valid = await gitRepo.isRepo();
    const repoData: RepoModel = {
      directory,
      group,
      localName,
      valid,
    };
    return repoData;
  }

  static async forEachRepositoryIn<T>({
    directory = this.baseDirectory,
    callback,
  }: {
    directory?: string;
    callback: (directory: string) => Promise<T>;
  }) {
    const allSubDirectories = await RepoHelper.getSubDirectories(directory);
    const subDirectories = allSubDirectories.filter((d) => {
      return !RepoConstants.ignoreDirectories.find((regex) => d.match(new RegExp(regex)));
    });

    const resultArray: T[] = [];

    for (const subDirectory of subDirectories) {
      const itemDirectory = RoutesUtils.resolve(directory, subDirectory);
      const gitDirectory = RoutesUtils.resolve(itemDirectory, '.git');
      const itemRelativeDirectory = RoutesUtils.relative(this.baseDirectory, itemDirectory);
      if (!fs.existsSync(gitDirectory)) {
        const nestedRepos = await this.forEachRepositoryIn({
          directory: itemDirectory,
          callback,
        });
        resultArray.push(...nestedRepos);
        continue;
      }
      const resultItem = await callback(itemRelativeDirectory);
      resultArray.push(resultItem);
    }

    return resultArray;
  }

  static async getSubDirectories(directory: string) {
    const subDirectories = await glob(RepoConstants.pattern, {
      cwd: directory,
    });
    return subDirectories.map((subDir) => {
      return subDir.split('\\').join('/');
    });
  }
}
