import { Injectable } from '@nestjs/common';
import { FilterQuery, Types } from 'mongoose';
import { RemoteHelper } from '../helpers/remote.helper';
import { RepoHelper } from '../helpers/repo.helper';
import { RemoteRepository } from '../repositories/remote.repository';
import { Remote } from '../schemas/remote.schema';
import { RemoteGroupType, SyncRemoteActionType } from '../types/remotes.type';
import { SortQueryData } from '../types/utils.types';
import { GitService } from './git.service';
import { LoggerService } from './logger.service';

@Injectable()
export class RemoteService {
  constructor(
    private readonly logger: LoggerService,
    private readonly remoteRepository: RemoteRepository,
    private readonly gitService: GitService,
  ) { }

  count() {
    return this.remoteRepository.count();
  }

  searchRepos(query: FilterQuery<Remote>, sort: SortQueryData<Remote>) {
    return this.remoteRepository.findAll(query, sort);
  }

  async fetchRemotesByGroup(group: RemoteGroupType) {
    const remotes = await this.remoteRepository.findByRemoteGroup(group);
    const fetchResults = [];

    this.logger.doLog(`remotes to fetch ${remotes.length}`);

    for (let idxRemote = 0; idxRemote < remotes.length; idxRemote++) {
      const remote = remotes[idxRemote];
      this.logger.doLog(
        `- remote ${idxRemote + 1} of ${remotes.length} (${remote.name}): ${remote.url}`,
      );
      const gitRepo = RepoHelper.getGitRepo(remote.directory);
      const fetchResult = await this.gitService.fetchRepoRemote(
        gitRepo,
        remote,
      );
      fetchResults.push(fetchResult);
    }

    const failed = fetchResults.filter((i) => i.fetchStatus === 'error').length;

    this.logger.doLog(`remotes fetched. fails ${failed}`);
    return fetchResults;
  }

  async syncRemoteById(
    id: Types.ObjectId,
    type: SyncRemoteActionType = SyncRemoteActionType.base,
    doFetch?: boolean,
  ) {
    this.logger.doLog(
      `starts sync remote by id: type=${type} doFetch=${doFetch}`,
    );
    const remote = await this.remoteRepository.findById(id);
    return this.syncRemoteByDirectory({
      directory: remote.directory,
      remoteName: remote.name,
      type,
      doFetch,
    });
  }

  async fetchById(id: Types.ObjectId) {
    const remote = await this.remoteRepository.findById(id);
    this.logger.doLog(`  fetch remote: ${remote.name}`);
    const status = await RemoteHelper.fetchRemote({
      directory: remote.directory,
      name: remote.name,
    });
    Object.assign(remote, status);
    const remoteFetched =
      await this.remoteRepository.upsertByDirectoryAndName(remote);
    return remoteFetched;
  }

  async syncRemoteByDirectory({
    directory,
    remoteName,
    type,
    doFetch,
  }: {
    directory: string;
    remoteName: string;
    type: SyncRemoteActionType;
    doFetch: boolean;
  }) {
    this.logger.doLog(`sync remote ${remoteName} in: ${directory}`);
    const remoteData = await RemoteHelper.getRemoteDataFromDirectory({
      directory,
      remoteName,
    });
    if (type === SyncRemoteActionType.base) {
      return this.syncRemoteInDirectory(remoteData);
    }
    return this.syncRemoteAndBranchesInDirectory(remoteData, {
      type,
      doFetch,
    });
  }

  async syncRemoteInDirectory(remoteData: Remote) {
    const remoteSynched =
      await this.remoteRepository.upsertByDirectoryAndName(remoteData);
    return { remoteSynched };
  }

  async syncRemoteAndBranchesInDirectory(
    remoteData: Remote,
    {
      type = SyncRemoteActionType.base,
      doFetch,
    }: {
      type: SyncRemoteActionType;
      doFetch?: boolean;
    },
  ) {
    const gitRepo = RepoHelper.getGitRepo(remoteData.directory);
    const opts = {
      gitRepo,
      directory: remoteData.directory,
      remoteName: remoteData.name,
    };

    if (doFetch) {
      this.logger.doLog(`  fetch remote: ${remoteData.name}`);
      const status = await RemoteHelper.fetchRemote({
        directory: remoteData.directory,
        name: remoteData.name,
      });
      Object.assign(remoteData, status);
    }

    const branchesSynched = RemoteHelper.isSyncBranch(type)
      ? await this.gitService.syncDirectoryBranches({ ...opts })
      : null;

    remoteData.branches = branchesSynched?.length || null;

    const remoteSynched =
      await this.remoteRepository.upsertByDirectoryAndName(remoteData);

    return { remoteSynched, branchesSynched };
  }
}
