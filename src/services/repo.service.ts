import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { FilterQuery, Types } from 'mongoose';
import { RepoHelper } from '../helpers/repo.helper';
import { BranchRepository } from '../repositories/branch.repository';
import { RemoteRepository } from '../repositories/remote.repository';
import { RepoRepository } from '../repositories/repo.repository';
import { Repo } from '../schemas/repo.schema';
import {
  ReposComparisonParams,
  SyncRepoActionType,
} from '../types/repos.types';
import { SortQueryData } from '../types/utils.types';
import { GitRepo } from '../utils/gitRepo.class';
import { routes } from '../utils/routes';
import { GitService } from './git.service';
import { LoggerService } from './logger.service';

@Injectable()
export class RepoService {
  constructor(
    private readonly logger: LoggerService,
    private readonly repoRepository: RepoRepository,
    private readonly remoteRepository: RemoteRepository,
    private readonly branchRepository: BranchRepository,
    private readonly gitService: GitService,
  ) { }

  count() {
    return this.repoRepository.count();
  }

  searchRepos(query: FilterQuery<Repo>, sort: SortQueryData<Repo>) {
    return this.repoRepository.findAll(query, sort);
  }

  async syncAll(
    type: SyncRepoActionType = SyncRepoActionType.base,
    doFetch?: boolean,
  ) {
    this.logger.doLog(
      `starts syn of all repo: type=${type} doFetch=${doFetch}`,
    );
    await this.repoRepository.truncate();
    const createdRepos = await RepoHelper.forEachRepositoryIn({
      callback: (directory) => {
        return this.syncRepoByDirectory({
          directory,
          type,
          doFetch,
        });
      },
    });
    this.logger.doLog(
      `ends synchronization of all repo: ${createdRepos.length}`,
    );
    return createdRepos;
  }

  async syncRepoById(
    id: Types.ObjectId,
    type: SyncRepoActionType = SyncRepoActionType.base,
    doFetch?: boolean,
  ) {
    this.logger.doLog(
      `starts sync repo by id: type=${type} doFetch=${doFetch}`,
    );
    const repo = await this.repoRepository.findById(id);
    return this.syncRepoByDirectory({
      directory: repo.directory,
      type,
      doFetch,
    });
  }

  async syncRepoByDirectory({
    directory,
    type,
    doFetch,
  }: {
    directory: string;
    type: SyncRepoActionType;
    doFetch: boolean;
  }) {
    this.logger.doLog(`sync repo in: ${directory}`);
    const repoData = await RepoHelper.getRepoDataFromDirectory(directory);
    if (type === SyncRepoActionType.base) {
      return this.syncRepoInDirectory(repoData);
    }
    return this.syncRepoRemotesAndBranchesInDirectory(repoData, {
      type,
      doFetch,
    });
  }

  async syncRepoInDirectory(repoData: Repo) {
    const repoSynched = await this.repoRepository.upsertByDirectory(repoData);
    return { repoSynched };
  }

  async syncRepoRemotesAndBranchesInDirectory(
    repoData: Repo,
    {
      doFetch,
      type = SyncRepoActionType.base,
    }: {
      type: SyncRepoActionType;
      doFetch?: boolean;
    },
  ) {
    const gitRepo = RepoHelper.getGitRepo(repoData.directory);
    const opts = { gitRepo, directory: repoData.directory };

    const remotesSynched = RepoHelper.isSyncRemote(type)
      ? await this.gitService.syncDirectoryRemotes({ ...opts, doFetch })
      : null;

    const branchesSynched = RepoHelper.isSyncBranch(type)
      ? await this.gitService.syncDirectoryBranches({ ...opts })
      : null;

    repoData.remotes = remotesSynched?.length || null;
    repoData.branches = branchesSynched?.length || null;

    const repoSynched = await this.repoRepository.upsertByDirectory(repoData);

    return { repoSynched, remotesSynched, branchesSynched };
  }

  async fetchRepoRemotesById(id: Types.ObjectId) {
    const repo = await this.repoRepository.findById(id);
    const { directory } = repo;
    const gitRepo = RepoHelper.getGitRepo(directory);
    const valid = await gitRepo.isRepo();
    if (!valid) {
      throw new BadGatewayException(`invalid repo ${id}`);
    }
    const remotes = await this.remoteRepository.findByRepo({ directory });

    this.logger.doLog(`- remotes to fetch ${remotes.length} in ${directory}`);
    const fetchPromises = remotes.map((remote) => {
      return this.gitService.fetchRepoRemote(gitRepo, remote);
    });
    const fetchResults = await Promise.all(fetchPromises);

    const failed = fetchResults.filter((i) => i.fetchStatus === 'error').length;
    this.logger.doLog(`- remotes fetched. fails ${failed}`);
    return fetchResults;
  }

  /////////////////////
  async compareRepos(params: ReposComparisonParams) {
    const { directoryFrom, directoryTo } = params;

    const [gitRepoFrom, gitRepoTo] = await this.validateGitRepos([
      directoryFrom,
      directoryTo,
    ]);

    const [branchesFrom, branchesTo] = await Promise.all([
      gitRepoFrom.getBranches(),
      gitRepoTo.getBranches(),
    ]);

    const branchesFromSummaryPromises = branchesFrom.map(async (branch) => {
      const sameNameBranchesToPromises = branchesTo
        .filter((b) => b.shortName === branch.shortName)
        .map(async (b) => {
          const isDescendent = await gitRepoTo.isDescendent(
            b.commit,
            branch.commit,
          );
          return { ...b, isDescendent };
        });

      const sameNameBranchesTo = await Promise.all(sameNameBranchesToPromises);

      const noDescendants = !sameNameBranchesTo.find((b) => b.isDescendent);

      return {
        ...branch,
        noDescendants,
        sameNameBranchesTo,
      };
    });

    const branchesFromSummary = await Promise.all(branchesFromSummaryPromises);
    const noDescendantsBranchesFrom = branchesFromSummary.filter(
      (b) => b.noDescendants,
    );

    return noDescendantsBranchesFrom;
  }

  validateGitRepos(directories: string[]) {
    const promises = directories.map(async (directory) => {
      const gitRepo = RepoHelper.getGitRepo(directory);
      const isRepo = await gitRepo.isRepo();
      if (!isRepo) {
        throw new BadRequestException(
          `directory ${directory} is not a git repo`,
        );
      }
      return gitRepo;
    });
    return Promise.all(promises);
  }
}
