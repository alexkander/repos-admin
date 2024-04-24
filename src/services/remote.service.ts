import { BadRequestException, Injectable } from '@nestjs/common';
import { FilterQuery, Types } from 'mongoose';
import { RemoteCheckoutRequestPayload } from 'src/controllers/dtos/remote-checkout-request-body';
import { RemotePullRequestPayload } from 'src/controllers/dtos/remote-pull-request-body';
import { RemotePushRequestPayload } from 'src/controllers/dtos/remote-push-request-body';
import { BranchRepository } from 'src/repositories/branch.repository';
import { RepoRepository } from 'src/repositories/repo.repository';
import { Branch } from 'src/schemas/branch.schema';
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
    private readonly repoRepository: RepoRepository,
    private readonly remoteRepository: RemoteRepository,
    private readonly branchRepository: BranchRepository,
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

  async checkout({ branchName, remoteBranchId }: RemoteCheckoutRequestPayload) {
    const remoteBranch = await this.branchRepository.findById(remoteBranchId);
    const gitRepo = RepoHelper.getGitRepo(remoteBranch.directory);
    await gitRepo.checkout(branchName, remoteBranch.commit);

    const newBranch: Branch = {
      directory: remoteBranch.directory,
      shortName: branchName,
      largeName: branchName,
      commit: remoteBranch.commit,
      backedUp: remoteBranch.shortName === branchName,
    };
    await this.branchRepository.upsertByDirectoryAndLargeName(newBranch);
    await this.gitService.updateRepoCountsByDirectory({
      directory: remoteBranch.directory,
    });
  }

  async push({ localBranchId, remoteId }: RemotePushRequestPayload) {
    const localBranch = await this.branchRepository.findById(localBranchId);
    if (localBranch.remote) {
      throw new BadRequestException('branch should be a local branch');
    }
    const remote = await this.remoteRepository.findById(remoteId);
    if (localBranch.directory !== remote.directory) {
      throw new BadRequestException(
        'remote and branch should to be in the same repository',
      );
    }
    const gitRepo = RepoHelper.getGitRepo(remote.directory);
    const result = await gitRepo.push(remote.name, localBranch.shortName);

    const newBranch: Branch = {
      directory: localBranch.directory,
      shortName: localBranch.shortName,
      remote: remote.name,
      commit: localBranch.commit,
      remoteSynched: true,
      largeName: gitRepo.getRemoteBranchName(
        remote.name,
        localBranch.shortName,
      ),
      backedUp: true,
    };

    await this.branchRepository.upsertByDirectoryAndLargeName(newBranch);

    await this.gitService.updateRepoCountsByDirectory({
      directory: localBranch.directory,
    });

    await this.gitService.updateRemoteCountsByDirectoryAndName({
      directory: localBranch.directory,
      name: remote.name,
    });

    return result;
  }

  async pull({ localBranchId, remoteId }: RemotePullRequestPayload) {
    const localBranch = await this.branchRepository.findById(localBranchId);
    if (localBranch.remote) {
      throw new BadRequestException('branch should be a local branch');
    }
    const remote = await this.remoteRepository.findById(remoteId);
    if (localBranch.directory !== remote.directory) {
      throw new BadRequestException(
        'remote and branch should to be in the same repository',
      );
    }
    const gitRepo = RepoHelper.getGitRepo(remote.directory);
    await gitRepo.checkout(localBranch.shortName);
    const result = await gitRepo.pull(remote.name, localBranch.shortName);
    await gitRepo.checkout('-');

    const branches = await gitRepo.getBranches();
    const branch = branches.find(
      (b) => !b.remote && b.shortName === localBranch.shortName,
    );

    const updateBranch: Branch = {
      ...localBranch,
      ...branch,
    };

    await this.branchRepository.upsertByDirectoryAndLargeName(updateBranch);

    await this.gitService.updateRepoCountsByDirectory({
      directory: localBranch.directory,
    });

    await this.gitService.updateRemoteCountsByDirectoryAndName({
      directory: localBranch.directory,
      name: remote.name,
    });

    return result;
  }
}
