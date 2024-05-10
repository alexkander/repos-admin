import { BadRequestException, Injectable } from '@nestjs/common';
import { RemoteRepository } from '../repositories/remote.repository';
import { Remote } from '../schemas/remote.schema';
import { RepoHelper } from '../helpers/repo.helper';
import { ReposComparisonParams } from '../types/repos.types';
import { LoggerService } from './logger.service';

@Injectable()
export class OldMethodsService {
  constructor(
    private readonly logger: LoggerService,
    private readonly remoteRepository: RemoteRepository,
  ) { }
  async compareRepos(params: ReposComparisonParams) {
    const { directoryFrom, directoryTo } = params;

    const [gitRepoFrom, gitRepoTo] = await this.validateGitRepos([
      directoryFrom,
      directoryTo,
    ]);

    const [branchesFrom, branchesTo] = await Promise.all([
      gitRepoFrom.getBranches(),
      gitRepoTo.getBranches(),
    ]);

    const branchesFromSummaryPromises = branchesFrom.map(async (branch) => {
      const sameNameBranchesToPromises = branchesTo
        .filter((b) => b.shortName === branch.shortName)
        .map(async (b) => {
          const isDescendent = await gitRepoTo.isDescendent(
            b.commit,
            branch.commit,
          );
          return { ...b, isDescendent };
        });

      const sameNameBranchesTo = await Promise.all(sameNameBranchesToPromises);

      const noDescendants = !sameNameBranchesTo.find((b) => b.isDescendent);

      return {
        ...branch,
        noDescendants,
        sameNameBranchesTo,
      };
    });

    const branchesFromSummary = await Promise.all(branchesFromSummaryPromises);
    const noDescendantsBranchesFrom = branchesFromSummary.filter(
      (b) => b.noDescendants,
    );

    return noDescendantsBranchesFrom;
  }

  validateGitRepos(directories: string[]) {
    const promises = directories.map(async (directory) => {
      return this.validateGitRepo(directory);
    });
    return Promise.all(promises);
  }

  async validateGitRepo(directory: string) {
    const gitRepo = RepoHelper.getGitRepo(directory);
    const isRepo = await gitRepo.isRepo();
    if (!isRepo) {
      throw new BadRequestException(`directory ${directory} is not a git repo`);
    }
    return gitRepo;
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
      const gitRepo = RepoHelper.getGitRepo(remoteToRemove.directory);
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
    const gitRepo = RepoHelper.getGitRepo(remote.directory);
    const branches = await gitRepo.getBranches();
    const remoteBranches = branches.filter((b) => b.remoteName === remote.name);
    const otherBranches = branches.filter((b) => b.remoteName !== remote.name);

    const resultsPromises = remoteBranches.map(async (branch) => {
      const sameNameBranchesPromises = otherBranches
        .filter((b) => b.shortName === branch.shortName)
        .map(async (b) => {
          return {
            branch: b.shortName,
            remote: b.remoteName,
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
