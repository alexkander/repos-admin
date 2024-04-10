import * as fs from 'fs';
import { glob } from 'glob';
import { configuration } from 'src/configuration/configuration';
import { RepoConstants } from 'src/constants/repo.constants';
import { Repo } from 'src/schemas/repo.schema';
import { GitRepo } from 'src/utils/gitRepo.class';
import { routes } from 'src/utils/routes';

export class RepoHelper {
  constructor() { }

  static getRealGitDirectory(directory: string = '') {
    const gitDirectory = routes.join(
      configuration.REPOSITORIES_DIRECTORY,
      directory,
    );
    return gitDirectory;
  }

  static async getRepoDataFromDirectory({
    directory,
    baseDirectory,
  }: {
    directory: string;
    baseDirectory: string;
  }) {
    const repoDirectory = routes.relative(baseDirectory, directory);
    const group = routes.dirname(repoDirectory);
    const localName = routes.basename(repoDirectory);
    const gitRepo = new GitRepo(directory);
    const valid = await gitRepo.isRepo();
    const repoData: Repo = {
      directory: repoDirectory,
      group,
      localName,
      valid,
    };
    return repoData;
  }


  static async forEachRepositoryIn<T>({
    directory,
    callback,
  }: {
    directory: string;
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
      if (!fs.existsSync(gitDirectory)) {
        const nestedRepos = await this.forEachRepositoryIn({
          directory: itemDirectory,
          callback,
        });
        resultArray.push(...nestedRepos);
        continue;
      }
      const resultItem = await callback(itemDirectory);
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
