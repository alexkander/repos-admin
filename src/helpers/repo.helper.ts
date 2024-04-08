import { glob } from 'glob';
import { configuration } from 'src/configuration/configuration';
import { RepoConstants } from 'src/constants/repo.constants';
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

  static async getSubDirectories(directory: string) {
    const subDirectories = await glob(RepoConstants.pattern, {
      cwd: directory,
    });
    return subDirectories.map((subDir) => {
      return subDir.split('\\').join('/');
    });
  }
}
