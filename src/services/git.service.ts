import { BadGatewayException, Injectable } from '@nestjs/common';
import { RepoHelper } from 'src/helpers/repo.helper';
import { RepoRepository } from 'src/repositories/repo.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { GitRepo } from 'src/utils/gitRepo.class';
import { RemoteHelper } from '../helpers/remote.helper';
import { BranchRepository } from '../repositories/branch.repository';
import { RemoteRepository } from '../repositories/remote.repository';
import { Remote } from '../schemas/remote.schema';
import {
  GitBranchType,
  GitRemoteType,
  GitTagType,
} from '../types/gitRepo.types';
import { RemoteFilterQuery, RepoFilterQuery } from '../types/remotes.type';
import { LoggerService } from './logger.service';

@Injectable()
export class GitService {
  constructor(
    private readonly logger: LoggerService,
    private readonly repoRepository: RepoRepository,
    private readonly remoteRepository: RemoteRepository,
    private readonly branchRepository: BranchRepository,
    private readonly tagRepository: TagRepository,
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
    await this.deleteNotSynchedRemotes(directory, allRemotes);
    const result = await Promise.all(upsertPromises);
    this.logger.doLog(`- remotes to sync ${result.length}`);
    return result;
  }

  deleteNotSynchedRemotes(directory: string, synchedRemotes: GitRemoteType[]) {
    const remotesNames = synchedRemotes.map(({ name }) => name);
    return this.remoteRepository.deleteByRepoExcludingRemotesNames({
      directory,
      excludeRemoteNames: remotesNames,
    });
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
    const branches = await gitRepo.getBranches();
    const gitBranches = (() => {
      if (allRemotes) {
        return [...branches];
      }
      return branches.filter((b) => remoteNames.indexOf(b.remote) !== -1);
    })();
    const branchesRemotes = await gitRepo.getBranchesFromRemotes(remoteNames);

    gitBranches.forEach((b) => {
      const branchRemote = branchesRemotes.find(
        (br) => b.shortName === br.refName && b.remote === br.remoteName,
      );
      b.remoteSynched = branchRemote?.commit.startsWith(b.commit) || false;
    });

    if (allRemotes) {
      await this.deleteNotSynchedBranches(directory, gitBranches);
    } else {
      await this.deleteNotSynchedBranches(directory, gitBranches, remoteNames);
    }

    this.logger.doLog(`- branches to sync ${gitBranches.length}`);
    const upsertPromises = gitBranches.map((gitBranch) => {
      return this.syncDirectoryBranch(directory, gitBranch);
    });
    const result = await Promise.all(upsertPromises);
    this.logger.doLog(`- branches to sync ${result.length}`);
    return result;
  }

  deleteNotSynchedBranches(
    directory: string,
    synchedBranches: GitBranchType[],
    remoteNames?: string[],
  ) {
    const branchesNames = synchedBranches.map((b) => b.largeName);
    return this.branchRepository.deleteByRemotesExcludingBranchLargeNames({
      directory,
      remoteNames,
      excludeBranchLargeNames: branchesNames,
    });
  }

  async syncDirectoryTags({
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
    const allTags = await gitRepo.getTags(remoteNames);
    const gitTags = (() => {
      if (allRemotes) {
        return [...allTags];
      }
      return allTags.filter((t) => remoteNames.indexOf(t.remoteName) !== -1);
    })();

    const gitRemotes = allTags.filter((t) => !!t.remoteName);

    gitTags.forEach((t) => {
      const tagRemote = gitRemotes.find(
        (rt) => t.remoteName === rt.remoteName && t.shortName === rt.shortName,
      );
      t.remoteSynched = tagRemote?.commit.startsWith(t.commit) || false;
    });

    if (allRemotes) {
      await this.deleteNotSynchedTags(directory, gitTags);
    } else {
      await this.deleteNotSynchedTags(directory, gitTags, remoteNames);
    }

    this.logger.doLog(`- tags to sync ${gitTags.length}`);
    const upsertPromises = gitTags.map((gitTag) => {
      return this.syncDirectoryTag(directory, gitTag);
    });
    const result = await Promise.all(upsertPromises);
    this.logger.doLog(`- tags to sync ${result.length}`);
    return result;
  }

  deleteNotSynchedTags(
    directory: string,
    synchedTags: GitTagType[],
    remoteNames?: string[],
  ) {
    const tagsNames = synchedTags.map((b) => b.largeName);
    return this.tagRepository.deleteByRemotesExcludingTagLargeNames({
      directory,
      remoteNames,
      excludeTagLargeNames: tagsNames,
    });
  }

  async syncDirectoryTag(directory: string, gitTag: GitTagType) {
    this.logger.doLog(`  sync tag: ${gitTag.shortName}`);
    const tagData = RemoteHelper.gitTagToTag({ gitTag, directory });
    return this.tagRepository.upsertByDirectoryAndLargeName(tagData);
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

  async removeRemoteAndBranches(filter: RemoteFilterQuery) {
    return Promise.all([
      this.remoteRepository.deleteByRepoAndName(filter),
      this.branchRepository.deleteByRemote(filter),
    ]);
  }
}
