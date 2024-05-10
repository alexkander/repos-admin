import { Injectable } from '@nestjs/common';
import { FilterQuery, Types } from 'mongoose';
import { SyncRepoOptions } from 'src/types/repos.types';
import { RepoHelper } from '../helpers/repo.helper';
import { RepoRepository } from '../repositories/repo.repository';
import { Repo } from '../schemas/repo.schema';
import { SortQueryData } from '../types/utils.types';
import { GitService } from './git.service';
import { LoggerService } from './logger.service';

@Injectable()
export class RepoService {
  constructor(
    private readonly logger: LoggerService,
    private readonly repoRepository: RepoRepository,
    private readonly gitService: GitService,
  ) { }

  count() {
    return this.repoRepository.count();
  }

  searchRepos(query: FilterQuery<Repo>, sort: SortQueryData<Repo>) {
    return this.repoRepository.findAll(query, sort);
  }

  async syncAll(opts: SyncRepoOptions) {
    await this.repoRepository.truncate();
    const createdRepos = await RepoHelper.forEachRepositoryIn({
      callback: (directory) => {
        return this.syncRepoByDirectory(directory, opts);
      },
    });
    this.logger.doLog(
      `ends synchronization of all repo: ${createdRepos.length}`,
    );
    return createdRepos;
  }

  async syncRepoById(id: Types.ObjectId, opts: SyncRepoOptions) {
    const repo = await this.repoRepository.findById(id);
    return this.syncRepoByDirectory(repo.directory, opts);
  }

  async syncRepoByDirectory(directory: string, opts: SyncRepoOptions) {
    this.logger.doLog(`sync repo in: ${directory}`);

    const repoData = await RepoHelper.getRepoDataFromDirectory(directory);
    const gitRepo = RepoHelper.getGitRepo(repoData.directory);

    const remotesSynched = await (() => {
      if (opts.syncRemotes) {
        return this.gitService.syncDirectoryRemotes({
          directory,
          gitRepo,
          doFetch: opts.doFetch,
        });
      }
    })();

    const remoteNames = remotesSynched?.map((r) => r.name) || [];
    const branchesSynched = await (() => {
      if (opts.syncBranches) {
        return this.gitService.syncDirectoryBranches({
          directory,
          gitRepo,
          remoteNames,
          allRemotes: true,
        });
      }
    })();

    const tagsSynched = await (() => {
      if (opts.syncTags) {
        return this.gitService.syncDirectoryTags({
          directory,
          gitRepo,
          remoteNames,
          allRemotes: true,
        });
      }
    })();

    repoData.remotes = remotesSynched?.length || 0;
    repoData.tags = tagsSynched?.length || 0;
    repoData.branches = branchesSynched?.length || 0;
    repoData.branchesToCheck =
      branchesSynched?.filter((b) => !b.backedUp)?.length || 0;

    const repoSynched = await this.repoRepository.upsertByDirectory(repoData);

    return { repoSynched, remotesSynched, branchesSynched };
  }

  async fetchRepoRemotesById(id: Types.ObjectId) {
    const repo = await this.repoRepository.findById(id);
    const { directory } = repo;

    const results = await this.gitService.fetchAllRepoRemotes({
      directory,
    });

    const failed = results.filter((i) => i.fetchStatus === 'error').length;
    this.logger.doLog(`- remotes fetched. fails ${failed}`);
    return results;
  }

  async checkStatusById(id: Types.ObjectId) {
    const repo = await this.repoRepository.findById(id);
    const { allBranches, allRemotes, allTags } =
      await this.gitService.getRepoBranchesAndRemotes(repo);
    const remotes = [{ name: 'local' }].concat(allRemotes);

    const branchesMap = this.groupByShortNameAndRemotes(allBranches);
    const tagsMap = this.groupByShortNameAndRemotes(allTags);

    const branches = Object.values(branchesMap);
    const tags = Object.values(tagsMap);
    return {
      repo,
      remotes,
      allRemotes,
      branches,
      allBranches,
      tags,
      allTags,
    };
  }

  groupByShortNameAndRemotes<
    T extends { shortName: string; remoteName?: string },
  >(allBranches: T[]) {
    const branchesMap: Record<
      string,
      { name: string; byRemote: Record<string, T> }
    > = {};
    allBranches.forEach((branch) => {
      const key = branch.shortName;
      branchesMap[key] = branchesMap[key] || {
        name: branch.shortName,
        byRemote: {},
      };
      branchesMap[key].byRemote[branch.remoteName || 'local'] = branch;
    });

    return branchesMap;
  }
}
