import { BadGatewayException, Injectable } from '@nestjs/common';
import { FilterQuery, Types } from 'mongoose';
import { RepoHelper } from '../helpers/repo.helper';
import { RemoteRepository } from '../repositories/remote.repository';
import { RepoRepository } from '../repositories/repo.repository';
import { Repo } from '../schemas/repo.schema';
import { SortQueryData } from '../types/utils.types';
import { GitService } from './git.service';
import { LoggerService } from './logger.service';
import { SyncRepoOptions } from 'src/types/repos.types';

@Injectable()
export class RepoService {
  constructor(
    private readonly logger: LoggerService,
    private readonly repoRepository: RepoRepository,
    private readonly remoteRepository: RemoteRepository,
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

    const remoteNames = (remotesSynched || []).map((r) => r.name);

    const branchesSynched = opts.syncBranches
      ? await this.gitService.syncDirectoryBranches({
          ...params,
          remoteNames,
        })
      : null;

    repoData.remotes = remotesSynched?.length || null;
    repoData.branches = branchesSynched?.length || null;

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
    const gitRepo = RepoHelper.getGitRepo(repo.directory);
    const allBranches = await gitRepo.getBranches();
    const allRemotes = await gitRepo.getRemotes();
    const remotes = [{ name: 'local' }].concat(allRemotes);
    const branchesMap: Record<
      string,
      {
        name: string;
        commits: Record<string, string>;
        largeNames: Record<string, string>;
      }
    > = {};
    allBranches.forEach((branch) => {
      const branchItem = branchesMap[branch.shortName] || {
        name: branch.shortName,
        commits: {},
        largeNames: {},
      };
      branchesMap[branch.shortName] = branchItem;
      branchItem.commits[branch.remote || 'local'] = branch.commit;
      branchItem.largeNames[branch.remote || 'local'] = branch.largeName;
    });
    const branches = Object.values(branchesMap);
    return { repo, branches, remotes, allRemotes };
  }
}
