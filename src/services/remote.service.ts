import { Injectable } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { RepoHelper } from 'src/helpers/repo.helper';
import { RemoteGroupType } from 'src/types/remotes.type';
import { RemoteRepository } from '../repositories/remote.repository';
import { Remote } from '../schemas/remote.schema';
import { SortQueryData } from '../types/utils.types';
import { GitRepo } from '../utils/gitRepo.class';
import { routes } from '../utils/routes';
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
    const baseDirectory = RepoHelper.getRealGitDirectory();
    const remotes = await this.remoteRepository.findByRemoteGroup(group);
    const fetchResults = [];

    this.logger.doLog(`remotes to fetch ${remotes.length}`);

    for (let idxRemote = 0; idxRemote < remotes.length; idxRemote++) {
      const remote = remotes[idxRemote];
      this.logger.doLog(
        `- remote ${idxRemote + 1} of ${remotes.length} (${remote.name}): ${remote.url}`,
      );
      const gitDirectory = routes.resolve(baseDirectory, remote.directory);
      const gitRepo = new GitRepo(gitDirectory);
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

  async remotesLonelyBranchesByGroup(targetHost: string, targetGroup: string) {
    const remotes = await this.remoteRepository.findByHostGroup({
      targetHost,
      targetGroup,
    });

    const resultRemotesPromises = remotes.map(async (remote) => {
      const summaryBranches = await this.getCompareSummaryBranches(remote);
      const noDescendantsBranches = summaryBranches.filter(
        (b) => !b.descendants.length,
      );
      return {
        directory: remote.directory,
        remote: remote.name,
        url: remote.url,
        summaryBranches,
        noDescendantsBranches,
      };
    });

    const resultRemotes = await Promise.all(resultRemotesPromises);
    const remotesWithNoDescendants = resultRemotes.filter(
      (b) => b.noDescendantsBranches.length,
    );

    return {
      resultRemotesCount: resultRemotes.length,
      remotesWithNoDescendantsCount: remotesWithNoDescendants.length,
      remotesWithNoDescendants: remotesWithNoDescendants,
    };
  }

  async removeRemotesWithNoLonelyBranches(
    targetHost: string,
    targetGroup: string,
  ) {
    const remotes = await this.remoteRepository.findByHostGroup({
      targetHost,
      targetGroup,
    });

    const resultRemotesPromises = remotes.map(async (remote) => {
      const summaryBranches = await this.getCompareSummaryBranches(remote);
      const noDescendantsBranches = summaryBranches.filter(
        (b) => !b.descendants.length,
      );
      return {
        directory: remote.directory,
        remote: remote.name,
        url: remote.url,
        summaryBranches,
        noDescendantsBranches,
      };
    });

    const resultRemotes = await Promise.all(resultRemotesPromises);
    const remotesWithDescendants = resultRemotes.filter(
      (b) => !b.noDescendantsBranches.length,
    );

    this.logger.doLog(`- remotes to remove: ${remotesWithDescendants.length}`);

    const remoteRemoveResults = [];

    for (let idx = 0; idx < remotesWithDescendants.length; idx++) {
      const remoteToRemove = remotesWithDescendants[idx];
      const gitDirectory = RepoHelper.getRealGitDirectory(
        remoteToRemove.directory,
      );
      const gitRepo = new GitRepo(gitDirectory);
      this.logger.doLog(
        `- ${idx + 1} of ${remotesWithDescendants.length}: removing remote ${remoteToRemove.remote} from ${remoteToRemove.directory}`,
      );
      const remoteRemoveResult = await gitRepo
        .removeRemote(remoteToRemove.remote)
        .catch((error) => ({ error, failed: true }));

      remoteRemoveResults.push(remoteRemoveResult);
    }

    return {
      resultRemotesCount: resultRemotes.length,
      remotesWithDescendantsCount: remotesWithDescendants.length,
      remoteRemoveResults: remoteRemoveResults,
      resultsFaileds: remoteRemoveResults.filter((i) => !!i.failed).length,
      remotesWithDescendants: remotesWithDescendants,
    };
  }

  async getCompareSummaryBranches(remote: Remote) {
    const gitDirectory = RepoHelper.getRealGitDirectory(remote.directory);
    const gitRepo = new GitRepo(gitDirectory);
    const branches = await gitRepo.getBranches();
    const remoteBranches = branches.filter((b) => b.remote === remote.name);
    const otherBranches = branches.filter((b) => b.remote !== remote.name);

    const resultsPromises = remoteBranches.map(async (branch) => {
      const sameNameBranchesPromises = otherBranches
        .filter((b) => b.shortName === branch.shortName)
        .map(async (b) => {
          return {
            branch: b.shortName,
            remote: b.remote,
            commit: b.commit,
            isDescendant: await gitRepo.isDescendent(b.commit, branch.commit),
          };
        });

      const sameNameBranches = await Promise.all(sameNameBranchesPromises);
      const descendants = sameNameBranches.filter((b) => b.isDescendant);

      return {
        branch: branch.shortName,
        commit: branch.commit,
        descendants,
      };
    });

    const results = await Promise.all(resultsPromises);

    return results;
  }
}
