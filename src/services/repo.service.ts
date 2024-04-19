import { BadGatewayException, Injectable } from '@nestjs/common';
import { FilterQuery, Types } from 'mongoose';
import { BranchRepository } from 'src/repositories/branch.repository';
import { Branch } from 'src/schemas/branch.schema';
import { SyncRepoOptions } from 'src/types/repos.types';
import { RepoHelper } from '../helpers/repo.helper';
import { RemoteRepository } from '../repositories/remote.repository';
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
    private readonly remoteRepository: RemoteRepository,
    private readonly branchesRepository: BranchRepository,
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
    const params = { gitRepo, directory: repoData.directory };

    const remotesSynched = opts.syncRemotes
      ? await this.gitService.syncDirectoryRemotes({
          ...params,
          doFetch: opts.doFetch,
        })
      : null;

    const remoteNames = remotesSynched?.map((r) => r.name) || [];

    const branchesSynched = opts.syncBranches
      ? await this.gitService.syncDirectoryBranches({
          ...params,
          remoteNames,
          allRemotes: true,
        })
      : null;

    repoData.remotes = remotesSynched?.length || 0;
    repoData.branches = branchesSynched?.length || 0;
    repoData.branchesToCheck =
      branchesSynched?.filter((b) => !b.backedUp)?.length || 0;

    const repoSynched = await this.repoRepository.upsertByDirectory(repoData);

    return { repoSynched, remotesSynched, branchesSynched };
  }

  async fetchRepoRemotesById(id: Types.ObjectId) {
    const repo = await this.repoRepository.findById(id);
    const { directory } = repo;
    const gitRepo = RepoHelper.getGitRepo(directory);
    const valid = await gitRepo.isRepo();
    if (!valid) {
      throw new BadGatewayException(`invalid repo ${id}`);
    }
    const remotes = await this.remoteRepository.findByRepo({ directory });

    this.logger.doLog(`- remotes to fetch ${remotes.length} in ${directory}`);
    const fetchPromises = remotes.map((remote) => {
      return this.gitService.fetchRepoRemote(gitRepo, remote);
    });
    const fetchResults = await Promise.all(fetchPromises);

    const failed = fetchResults.filter((i) => i.fetchStatus === 'error').length;
    this.logger.doLog(`- remotes fetched. fails ${failed}`);
    return fetchResults;
  }

  async checkStatusById(id: Types.ObjectId) {
    const repo = await this.repoRepository.findById(id);
    const allBranches = await this.branchesRepository.findByRepo(repo);
    const allRemotes = await this.remoteRepository.findByRepo(repo);
    const remotes = [{ name: 'local' }].concat(allRemotes);
    const branchesToCheckout = allBranches.map((branch) => {
      const canCheckout = this.canCheckoutRemoteBranch(branch, allBranches);
      return {
        ...branch,
        id: branch._id.toString(),
        canCheckout,
      };
    });
    const branchesMap: Record<
      string,
      {
        name: string;
        branchesByRemote: Record<string, Branch>;
      }
    > = {};
    branchesToCheckout.forEach((branch) => {
      const key = branch.shortName;
      branchesMap[key] = branchesMap[key] || {
        name: branch.shortName,
        branchesByRemote: {},
      };
      branchesMap[key].branchesByRemote[branch.remote || 'local'] = branch;
    });
    const branches = Object.values(branchesMap);
    return {
      repo,
      remotes,
      allRemotes,
      allBranches,
      branchesToCheckout,
      branches,
    };
  }

  canCheckoutRemoteBranch(branch: Branch, allBranches: Branch[]) {
    if (!branch.remote) {
      return false;
    }
    return !allBranches.find(
      (b) => !b.remote && b.shortName === branch.shortName,
    );
  }
}
