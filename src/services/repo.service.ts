import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { FilterQuery, Types } from 'mongoose';
import { RepoHelper } from 'src/helpers/repo.helper';
import { RepoConstants } from '../constants/repo.constants';
import { RemoteHelper } from '../helpers/remote.helper';
import { RemoteRepository } from '../repositories/remote.repository';
import { RepoRepository } from '../repositories/repo.repository';
import { Remote } from '../schemas/remote.schema';
import { Repo } from '../schemas/repo.schema';
import {
  FetchLogStatusType,
  RemoteFetchStatus,
  RemoteFilterQuery,
} from '../types/remotes.type';
import { ReposComparisonParams } from '../types/repos.types';
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
  ) { }

  count() {
    return this.repoRepository.count();
  }

  searchRepos(query: FilterQuery<Repo>, sort: SortQueryData<Repo>) {
    return this.repoRepository.findAll(query, sort);
  }

  async sync() {
    this.logger.doLog('starts synchronization of all repo');
    await this.repoRepository.truncate();
    const baseDirectory = RepoHelper.getRealGitDirectory();
    const createdRepos = await this.forEachRepositoryIn({
      directory: baseDirectory,
      callback: (directory) => {
        return this.syncRepoIn({ directory, baseDirectory });
      },
    });
    this.logger.doLog(
      `ends synchronization of all repo: ${createdRepos.length}`,
    );
    return createdRepos;
  }

  async syncRepoIn({
    directory,
    baseDirectory,
  }: {
    directory: string;
    baseDirectory: string;
  }) {
    this.logger.doLog(`sync repo in: ${directory}`);
    const repoData = await RepoHelper.getRepoDataFromDirectory({
      baseDirectory,
      directory,
    });
    const repoCreated = await this.repoRepository.upsertByDirectory(repoData);
    return repoCreated;
  }

  async syncById(id: Types.ObjectId) {
    const baseDirectory = RepoHelper.getRealGitDirectory();
    const repo = await this.repoRepository.findById(id);
    const synchedRepo = await this.syncRepoIn({
      directory: routes.resolve(baseDirectory, repo.directory),
      baseDirectory,
    });
    return synchedRepo;
  }

  async forEachRepositoryIn<T>({
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

  async refresh(id: Types.ObjectId) {
    const repo = await this.repoRepository.findById(id);
    const gitRemotes = await this.getRemotesFromGitRepo(repo.directory);
    const bdRemotes = await this.remoteRepository.findByRepo(repo);
    const upsertPromises = gitRemotes.map((gitRemote) => {
      const remoteData = RemoteHelper.gitRepoToBdRepo({
        gitRemote,
        directory: repo.directory,
      });
      const bdRemote = bdRemotes.find((r) => r.name === remoteData.name);
      if (!bdRemote) {
        return this.remoteRepository.create(remoteData);
      }
      return this.remoteRepository.updateById(bdRemote._id, remoteData);
    });
    const results = await Promise.all(upsertPromises);
    return results;
  }

  async getRemotesFromGitRepo(directory: string) {
    const gitDirectory = RepoHelper.getRealGitDirectory(directory);
    const repo = new GitRepo(gitDirectory);
    const remotesData = await repo.getRemotes();
    const remotes = remotesData.map((item) => {
      return {
        directory,
        ...item,
      };
    });
    return remotes;
  }

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
    const gitDirectory = RepoHelper.getRealGitDirectory(remote.directory);
    const gitRepo = new GitRepo(gitDirectory);
    const filter: RemoteFilterQuery = {
      directory: remote.directory,
      name: remote.name,
    };
    const result = await gitRepo
      .fetchAll(remote.name)
      .then((response) => ({
        status: FetchLogStatusType.SUCCESS,
        result: response,
      }))
      .catch((error) => ({ status: FetchLogStatusType.ERROR, result: error }));
    const status: RemoteFetchStatus = {
      fetchStatus: result.status,
      fetchResult: result.result,
    };
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
