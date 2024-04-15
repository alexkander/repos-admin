import * as fs from 'fs';
import { glob } from 'glob';
import { configuration } from '../configuration/configuration';
import { RepoConstants } from '../constants/repo.constants';
import { Repo } from '../schemas/repo.schema';
import { GitRepo } from '../utils/gitRepo.class';
import { routes } from '../utils/routes';

export class RepoHelper {
  public static readonly baseDirectory = routes.resolve(
    configuration.REPOSITORIES_DIRECTORY,
  );

  constructor() { }

  static getGitRepo(directory: string) {
    const gitDirectory = routes.resolve(this.baseDirectory, directory);
    return new GitRepo(gitDirectory);
  }

  static async getRepoDataFromDirectory(directory: string) {
    const group = routes.dirname(directory);
    const localName = routes.basename(directory);
    const gitRepo = this.getGitRepo(directory);
    const valid = await gitRepo.isRepo();
    const repoData: Repo = {
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
      return !RepoConstants.ignoreDirectories.find((regex) =>
        d.match(new RegExp(regex)),
      );
    });

    const resultArray: T[] = [];

    for (const subDirectory of subDirectories) {
      const itemDirectory = routes.resolve(directory, subDirectory);
      const gitDirectory = routes.resolve(itemDirectory, '.git');
      const itemRelativeDirectory = routes.relative(
        this.baseDirectory,
        itemDirectory,
      );
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
