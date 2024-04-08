import { configuration } from 'src/configuration/configuration';
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
}
