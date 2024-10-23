import { configuration } from '../../configuration';
import { Logger } from '../../libs/logger';
import { Repository } from '../../libs/nedb';
import { RoutesUtils } from '../../libs/routes-utils';
import { GitService } from '../git-utils/git.service';
import { RepoHelper } from './repo.helper';
import { RepoModel } from './repo.model';
import { SyncRepoOptions } from './repo.types';

export class RepoService {
  protected readonly logger = new Logger();
  protected readonly baseDirectory = RoutesUtils.resolve(configuration.REPOSITORIES_DIRECTORY);
  protected readonly repoRepository = Repository.build(RepoModel);
  protected readonly gitService = new GitService();

  find() {
    return this.repoRepository.find();
  }

  async sync(opts: SyncRepoOptions) {
    await this.repoRepository.truncate();

    const createdRepos = await RepoHelper.forEachRepositoryIn({
      directory: this.baseDirectory,
      callback: (directory) => this.syncRepoByDirectory(directory, opts),
    });
    this.logger.doLog(`ends synchronization of all repo: ${createdRepos.length}`);
    return createdRepos;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async syncRepoByDirectory(directory: string, opts: SyncRepoOptions) {
    this.logger.doLog(`sync repo in: ${directory}`);
    const repoData = await RepoHelper.getRepoDataFromDirectory(directory);

    repoData.remotes = 0;
    repoData.tags = 0;
    repoData.branches = 0;
    repoData.branchesToCheck = 0;
    repoData.tagsToCheck = 0;

    const repoSynched = await this.upsertByDirectory(repoData);
    return repoSynched;
  }

  async upsertByDirectory(data: RepoModel) {
    const record = await this.repoRepository.findOne({ directory: data.directory });
    if (!record) {
      return this.repoRepository.create({ ...data });
    }
    Object.assign(record, data);
    await this.repoRepository.update(record._id, { ...data });
    return record;
  }
}
