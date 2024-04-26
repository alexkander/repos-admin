import { BadGatewayException, Injectable } from '@nestjs/common';
import { RepoHelper } from 'src/helpers/repo.helper';
import { RepoRepository } from 'src/repositories/repo.repository';
import { RemoteHelper } from '../helpers/remote.helper';
import { BranchRepository } from '../repositories/branch.repository';
import { RemoteRepository } from '../repositories/remote.repository';
import { Remote } from '../schemas/remote.schema';
import { GitBranchType, GitRemoteType } from '../types/gitRepo.types';
import { RemoteFilterQuery, RepoFilterQuery } from '../types/remotes.type';
import { GitRepo } from '../utils/gitRepo.class';
import { LoggerService } from './logger.service';

@Injectable()
export class GitService {
  constructor(
    private readonly logger: LoggerService,
    private readonly repoRepository: RepoRepository,
    private readonly remoteRepository: RemoteRepository,
    private readonly branchRepository: BranchRepository,
  ) { }

  async getRepoBranchesAndRemotes({ directory }: RepoFilterQuery) {
    const [allBranches, allRemotes] = await Promise.all([
      this.branchRepository.findByRepo({ directory }),
      this.remoteRepository.findByRepo({ directory }),
    ]);
    return { allBranches, allRemotes };
  }

  async fetchAllRepoRemotes({ directory }: RepoFilterQuery) {
    const remotes = await this.remoteRepository.findByRepo({ directory });

    const gitRepo = RepoHelper.getGitRepo(directory);
    const valid = await gitRepo.isRepo();
    if (!valid) {
      throw new BadGatewayException(`invalid repo ${directory}`);
    }

    this.logger.doLog(`- remotes to fetch ${remotes.length} in ${directory}`);
    const fetchPromises = remotes.map((remote) => {
      return this.fetchRepoRemote(gitRepo, remote);
    });

    const fetchResults = await Promise.all(fetchPromises);

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
    await this.branchRepository.deleteByRemotesExcludingBranchLargeNames({
      directory,
      remoteNames,
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

  async updateRepoCountsByDirectory({ directory }: RepoFilterQuery) {
    const repo = await this.repoRepository.findOneByRepo({
      directory,
    });
    const counts = await this.getRepoCountsByDirectory({ directory });
    Object.assign(repo, counts);
    return await this.repoRepository.upsertByDirectory(repo);
  }

  async getRepoCountsByDirectory({ directory }: RepoFilterQuery) {
    const [branchesArr, remotes] = await Promise.all([
      this.branchRepository.findByRepo({ directory }),
      this.remoteRepository.countByRepo({ directory }),
    ]);
    const branches = branchesArr.length;
    const branchesToCheck = branchesArr.filter((b) => !b.backedUp).length;
    return {
      branches,
      branchesToCheck,
      remotes,
    };
  }

  async updateRemoteCountsByDirectoryAndName(filter: RemoteFilterQuery) {
    const remote = await this.remoteRepository.findOneInRepoByName(filter);
    const counts = await this.getRemoteCountsByDirectoryAndName(filter);
    Object.assign(remote, counts);
    return await this.remoteRepository.upsertByDirectoryAndName(remote);
  }

  async getRemoteCountsByDirectoryAndName(filter: RemoteFilterQuery) {
    const branchesArr = await this.branchRepository.findByRemote(filter);
    const branches = branchesArr.length;
    const branchesToCheck = branchesArr.filter((b) => !b.backedUp).length;
    return {
      branches,
      branchesToCheck,
    };
  }
}
