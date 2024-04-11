import { Injectable } from '@nestjs/common';
import { BranchRepository } from '../repositories/branch.repository';
import { GitBranchType, GitRemoteType } from '../types/gitRepo.types';
import { RemoteHelper } from '../helpers/remote.helper';
import { RemoteRepository } from '../repositories/remote.repository';
import { Remote } from '../schemas/remote.schema';
import { RemoteFilterQuery } from '../types/remotes.type';
import { GitRepo } from '../utils/gitRepo.class';
import { LoggerService } from './logger.service';

@Injectable()
export class GitService {
  constructor(
    private readonly logger: LoggerService,
    private readonly remoteRepository: RemoteRepository,
    private readonly branchRepository: BranchRepository,
  ) { }

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

  async syncDirectoryRemotes({
    gitRepo,
    directory,
    doFetch,
  }: {
    gitRepo: GitRepo;
    directory: string;
    doFetch?: boolean;
  }) {
    const valid = await gitRepo.isRepo();
    if (!valid) return null;
    const allRemotes = await gitRepo.getRemotes();
    this.logger.doLog(`- remotes to sync ${allRemotes.length}`);
    const upsertPromises = allRemotes.map((gitRemote) => {
      return this.syncDirectoryRemote(directory, gitRemote, doFetch);
    });
    const result = await Promise.all(upsertPromises);
    this.logger.doLog(`- remotes to sync ${result.length}`);
    return result;
  }

  async syncDirectoryBranches({
    gitRepo,
    directory,
    remoteName,
  }: {
    gitRepo: GitRepo;
    directory: string;
    remoteName?: string;
  }) {
    const valid = await gitRepo.isRepo();
    if (!valid) return null;
    const allBranches = await gitRepo.getBranches();
    const gitBranches = allBranches.filter((b) => {
      return !remoteName || remoteName === b.remote;
    });
    this.logger.doLog(`- branches to sync ${gitBranches.length}`);
    const upsertPromises = gitBranches.map((gitBranch) => {
      return this.syncDirectoryBranch(directory, gitBranch);
    });
    const result = await Promise.all(upsertPromises);
    this.logger.doLog(`- branches to sync ${result.length}`);
    return result;
  }
}
