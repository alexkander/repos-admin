import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { FilterQuery, Types } from 'mongoose';
import { RepoHelper } from 'src/helpers/repo.helper';
import { BranchRepository } from 'src/repositories/branch.repository';
import { GitBranchType, GitRemoteType } from 'src/types/gitRepo.types';
import { RemoteHelper } from '../helpers/remote.helper';
import { RemoteRepository } from '../repositories/remote.repository';
import { RepoRepository } from '../repositories/repo.repository';
import { Remote } from '../schemas/remote.schema';
import { Repo } from '../schemas/repo.schema';
import { RemoteFilterQuery } from '../types/remotes.type';
import { ReposComparisonParams, SyncActionType } from '../types/repos.types';
import { SortQueryData, WithBDId } from '../types/utils.types';
import { GitRepo } from '../utils/gitRepo.class';
import { routes } from '../utils/routes';
import { LoggerService } from './logger.service';

@Injectable()
export class RepoService {
  constructor(
    private readonly logger: LoggerService,
    private readonly repoRepository: RepoRepository,
    private readonly remoteRepository: RemoteRepository,
    private readonly branchRepository: BranchRepository,
  ) { }

  count() {
    return this.repoRepository.count();
  }

  searchRepos(query: FilterQuery<Repo>, sort: SortQueryData<Repo>) {
    return this.repoRepository.findAll(query, sort);
  }

  async syncAll(type: SyncActionType = SyncActionType.base, doFetch?: boolean) {
    this.logger.doLog(
      `starts syn of all repo: type=${type} doFetch=${doFetch}`,
    );
    await this.repoRepository.truncate();
    const baseDirectory = RepoHelper.getRealGitDirectory();
    const createdRepos = await RepoHelper.forEachRepositoryIn({
      directory: baseDirectory,
      callback: (directory) => {
        return this.syncRepoByDirectory({
          baseDirectory,
          directory: directory,
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
    type: SyncActionType = SyncActionType.base,
    doFetch?: boolean,
  ) {
    this.logger.doLog(
      `starts sync repo by id: type=${type} doFetch=${doFetch}`,
    );
    const baseDirectory = RepoHelper.getRealGitDirectory();
    const repo = await this.repoRepository.findById(id);
    return this.syncRepoByDirectory({
      baseDirectory,
      directory: repo.directory,
      type,
      doFetch,
    });
  }

  async syncRepoByDirectory({
    directory,
    baseDirectory,
    type,
    doFetch,
  }: {
    directory: string;
    baseDirectory: string;
    type: SyncActionType;
    doFetch: boolean;
  }) {
    this.logger.doLog(`sync repo in: ${directory}`);
    if (type === SyncActionType.base) {
      return this.syncRepoInDirectory({
        directory: routes.resolve(baseDirectory, directory),
        baseDirectory,
      });
    }
    return this.syncRepoRemotesAndBranchesInDirectory({
      directory: routes.resolve(baseDirectory, directory),
      baseDirectory,
      type,
      doFetch,
    });
  }

  async syncRepoInDirectory({
    directory,
    baseDirectory,
  }: {
    directory: string;
    baseDirectory: string;
  }) {
    const repoData = await RepoHelper.getRepoDataFromDirectory({
      baseDirectory,
      directory,
    });
    const repoSynched = await this.repoRepository.upsertByDirectory(repoData);
    return { repoSynched };
  }

  async syncRepoRemotesAndBranchesInDirectory({
    directory,
    baseDirectory,
    doFetch,
    type = SyncActionType.base,
  }: {
    directory: string;
    baseDirectory: string;
    type: SyncActionType;
    doFetch?: boolean;
  }) {
    const repoData = await RepoHelper.getRepoDataFromDirectory({
      baseDirectory,
      directory,
    });
    const gitRepo = new GitRepo(directory);
    const validPromise = gitRepo.isRepo();
    const repoDirectory = repoData.directory;

    const syncRemotes = async () => {
      if (!(await validPromise)) return null;
      const remotes = await gitRepo.getRemotes();
      repoData.remotes = remotes.length;
      return this.syncDirectoryRemotes(repoDirectory, remotes, doFetch);
    };

    const syncBranches = async () => {
      if (!(await validPromise)) return null;
      const branches = await gitRepo.getBranches();
      repoData.branches = branches.length;
      return this.syncDirectoryBranches(repoData.directory, branches);
    };

    const remotesSynched = RemoteHelper.isSyncRemote(type)
      ? await syncRemotes()
      : null;
    const branchesSynched = RemoteHelper.isSyncBranch(type)
      ? await syncBranches()
      : null;

    const repoSynched = await this.repoRepository.upsertByDirectory(repoData);
    return { repoSynched, remotesSynched, branchesSynched };
  }

  async syncDirectoryRemotes(
    directory: string,
    gitRemotes: GitRemoteType[],
    doFetch?: boolean,
  ) {
    this.logger.doLog(`- remotes to sync ${gitRemotes.length}`);
    const upsertPromises = gitRemotes.map((gitRemote) => {
      return this.syncDirectoryRemote(directory, gitRemote, doFetch);
    });
    const result = await Promise.all(upsertPromises);
    this.logger.doLog(`- remotes to sync ${result.length}`);
    return result;
  }

  async syncDirectoryBranches(directory: string, gitBranches: GitBranchType[]) {
    this.logger.doLog(`- branches to sync ${gitBranches.length}`);
    const upsertPromises = gitBranches.map((gitBranch) => {
      return this.syncDirectoryBranch(directory, gitBranch);
    });
    const result = await Promise.all(upsertPromises);
    this.logger.doLog(`- branches to sync ${result.length}`);
    return Promise.all(result);
  }

  async syncDirectoryRemote(
    directory: string,
    gitRemote: GitRemoteType,
    doFetch?: boolean,
  ) {
    this.logger.doLog(`  sync remote: ${gitRemote.name}`);
    const remoteData = RemoteHelper.gitRemoteToRemote({
      gitRemote,
      directory,
    });
    if (doFetch) {
      this.logger.doLog(`  fetch remote: ${gitRemote.name}`);
      const status = await RemoteHelper.fetchRemote({
        directory,
        name: gitRemote.name,
      });
      Object.assign(remoteData, status);
    }
    return this.remoteRepository.upsertByDirectoryAndName(remoteData);
  }

  async syncDirectoryBranch(directory: string, gitBranch: GitBranchType) {
    this.logger.doLog(`  sync branch: ${gitBranch.shortName}`);
    const branchData = RemoteHelper.gitBranchToBranch({
      gitBranch,
      directory,
    });
    return this.branchRepository.upsertByDirectoryAndLargeName(branchData);
  }

  async fetchRepoRemotesById(id: Types.ObjectId) {
    const baseDirectory = RepoHelper.getRealGitDirectory();
    const repo = await this.repoRepository.findById(id);
    const { directory } = repo;
    const gitDirectory = routes.resolve(baseDirectory, directory);
    const gitRepo = new GitRepo(gitDirectory);
    if (!(await gitRepo.isRepo())) {
      throw new BadGatewayException(`invalid repo ${id}`);
    }
    const remotes = await this.remoteRepository.findByRepo({ directory });

    this.logger.doLog(`- remotes to fetch ${remotes.length} in ${directory}`);
    const fetchPromises = remotes.map((r) => {
      return this.fetchRepoRemote(gitRepo, r);
    });
    const fetchResults = await Promise.all(fetchPromises);

    const failed = fetchResults.filter((i) => i.fetchStatus === 'error').length;
    this.logger.doLog(`- remotes fetched. fails ${failed}`);
    return fetchResults;
  }

  async fetchRepoRemote(gitRepo: GitRepo, remote: Remote) {
    this.logger.doLog(`  fetch remote: ${remote.name}: ${remote.url}`);
    const filter: RemoteFilterQuery = {
      directory: remote.directory,
      name: remote.name,
    };
    const status = await RemoteHelper.fetchRemoteFromGitRepo(
      gitRepo,
      remote.name,
    );
    const update = await this.remoteRepository.updateFetchInfo(filter, status);
    return { ...filter, ...status, update };
  }

  ////---------------
  async gitFetch(type: string) {
    const remotes = await this.remoteRepository.all();
    const fetchResults = [];
    const remotesFilter = remotes.filter((r) => this.remoteFilter(type, r));

    this.logger.doLog(`remotes to fetch ${remotesFilter.length}`);

    for (let idxRemote = 0; idxRemote < remotesFilter.length; idxRemote++) {
      const remote = remotesFilter[idxRemote];
      this.logger.doLog(
        `- remote ${idxRemote + 1} of ${remotesFilter.length} (${remote.name}): ${remote.url}`,
      );
      const fetchResult = await this.fetchRemotesFromRepo(remote);
      fetchResults.push(fetchResult);
    }

    const failed = fetchResults.filter((i) => i.fetchStatus === 'error').length;

    this.logger.doLog(`remotes fetched. fails ${failed}`);
    return { failed, fetchResults };
  }

  remoteFilter(type: string, remote: WithBDId & Remote) {
    if (type === 'all') {
      return true;
    } else if (type === 'fetchStatusError') {
      return remote.fetchStatus === 'error';
    } else if (type === 'notFetched') {
      return !remote.fetchStatus;
    } else if (typeof type === 'string') {
      return type === remote._id.toHexString();
    }
    return true;
  }

  async fetchRemotesFromRepo(remote: Remote) {
    const filter: RemoteFilterQuery = {
      directory: remote.directory,
      name: remote.name,
    };
    const status = await RemoteHelper.fetchRemote(filter);
    const update = await this.remoteRepository.updateFetchInfo(filter, status);
    return { ...filter, ...status, update };
  }

  async compareRepos(params: ReposComparisonParams) {
    const { directoryFrom, directoryTo } = params;

    const [gitRepoFrom, gitRepoTo] = await this.validateGitRepos([
      RepoHelper.getRealGitDirectory(directoryFrom),
      RepoHelper.getRealGitDirectory(directoryTo),
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
      const gitRepo = new GitRepo(directory);
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
