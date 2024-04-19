import { Injectable } from '@nestjs/common';
import { RemoteHelper } from '../helpers/remote.helper';
import { BranchRepository } from '../repositories/branch.repository';
import { RemoteRepository } from '../repositories/remote.repository';
import { Remote } from '../schemas/remote.schema';
import { GitBranchType, GitRemoteType } from '../types/gitRepo.types';
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
    branches: GitBranchType[],
    doFetch?: boolean,
  ) {
    this.logger.doLog(`  sync remote: ${gitRemote.name}`);
    const remoteData = RemoteHelper.gitRemoteToRemote({
      gitRemote,
      directory,
    });
    remoteData.branches = branches.length;
    remoteData.branchesToCheck = branches.filter((b) => !b.backedUp).length;
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
    const allBranches = await gitRepo.getBranches();
    this.logger.doLog(`- remotes to sync ${allRemotes.length}`);
    const upsertPromises = allRemotes.map((gitRemote) => {
      const remotesBranches = allBranches.filter(
        (b) => b.remote === gitRemote.name,
      );
      return this.syncDirectoryRemote(
        directory,
        gitRemote,
        remotesBranches,
        doFetch,
      );
    });
    const remotesNames = allRemotes.map(({ name }) => name);
    await this.remoteRepository.deleteByRepoExcludingRemotesNames({
      directory,
      excludeRemoteNames: remotesNames,
    });
    const result = await Promise.all(upsertPromises);
    this.logger.doLog(`- remotes to sync ${result.length}`);
    return result;
  }

  async syncDirectoryBranches({
    gitRepo,
    directory,
    remoteNames,
    allRemotes,
  }: {
    gitRepo: GitRepo;
    directory: string;
    remoteNames: string[];
    allRemotes?: boolean;
  }) {
    const valid = await gitRepo.isRepo();
    if (!valid) return null;
    const allBranches = await gitRepo.getBranches();
    const gitBranches = allRemotes
      ? [...allBranches]
      : allBranches.filter((b) => remoteNames.indexOf(b.remote) !== -1);
    const branchesRemotes = await gitRepo.getBranchesFromRemotes(remoteNames);

    gitBranches.forEach((b) => {
      const branchRemote = branchesRemotes.find(
        (br) => b.shortName === br.refName && b.remote === br.remoteName,
      );
      b.remoteSynched = branchRemote?.commit.startsWith(b.commit) || false;
    });

    const branchesNames = gitBranches.map(({ largeName }) => largeName);
    await this.branchRepository.deleteByRepoExcludingBranchLargeNames({
      directory,
      excludeBranchLargeNames: branchesNames,
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
