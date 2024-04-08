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
    const repo = new GitRepo(directory);
    const valid = await repo.isRepo();
    const remotes = valid ? await repo.getRemotes() : [];
    const branches = valid ? await repo.getBranches() : [];
    const repoData: Repo = {
      directory: repoDirectory,
      group,
      localName,
      valid,
      remotes: remotes.length,
      branches: branches.length,
    };
    return repoData;
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
