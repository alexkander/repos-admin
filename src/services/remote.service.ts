import { Injectable } from '@nestjs/common';
import { FilterQuery, Types } from 'mongoose';
import { AddRemoteRequestPayload } from 'src/controllers/dtos/add-remote-request-body';
import { RemoteHelper } from '../helpers/remote.helper';
import { RepoHelper } from '../helpers/repo.helper';
import { RemoteRepository } from '../repositories/remote.repository';
import { Remote } from '../schemas/remote.schema';
import { RemoteGroupType, SyncRemoteOptions } from '../types/remotes.type';
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

  async syncRemoteById(id: Types.ObjectId, opts: SyncRemoteOptions) {
    const remote = await this.remoteRepository.findById(id);
    return this.syncRemoteByDirectoryAndName(
      remote.directory,
      remote.name,
      opts,
    );
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

  async syncRemoteByDirectoryAndName(
    directory: string,
    remoteName: string,
    opts: SyncRemoteOptions,
  ) {
    this.logger.doLog(`sync remote ${remoteName} in: ${directory}`);
    const remoteData = await RemoteHelper.getRemoteDataFromDirectory({
      directory,
      remoteName,
    });
    const gitRepo = RepoHelper.getGitRepo(remoteData.directory);
    const params = {
      gitRepo,
      directory: remoteData.directory,
      remoteName: remoteData.name,
    };

    if (opts.doFetch) {
      this.logger.doLog(`  fetch remote: ${remoteData.name}`);
      const status = await RemoteHelper.fetchRemote({
        directory: remoteData.directory,
        name: remoteData.name,
      });
      Object.assign(remoteData, status);
    }

    const branchesSynched = opts.syncBranches
      ? await this.gitService.syncDirectoryBranches({
          ...params,
          remoteNames: [remoteData.name],
        })
      : null;

    remoteData.branchesToCheck =
      branchesSynched?.filter((b) => !b.backedUp)?.length || 0;
    remoteData.branches = branchesSynched?.length || 0;

    const remoteSynched =
      await this.remoteRepository.upsertByDirectoryAndName(remoteData);

    return { remoteSynched, branchesSynched };
  }

  async addRemote({
    directory,
    remoteName,
    remoteUrl,
    doFetch,
  }: AddRemoteRequestPayload) {
    const repoData = await RepoHelper.getRepoDataFromDirectory(directory);
    const gitRepo = RepoHelper.getGitRepo(repoData.directory);

    const result = await gitRepo.addRemote(remoteName, remoteUrl);

    await this.syncRemoteByDirectoryAndName(repoData.directory, remoteName, {
      syncBranches: true,
      doFetch: doFetch,
    });

    await this.gitService.updateRepoCountsByDirectory({
      directory: repoData.directory,
    });

    return result;
  }
}
