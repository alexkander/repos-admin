import { Injectable } from '@nestjs/common';
import { FolderRepository } from '../repositories/folder.repository';
import { RemoteRepository } from '../repositories/remote.repository';
import { RepoRepository } from '../repositories/repo.repository';
import { Remote } from '../schemas/remote.schema';
import { GitRepo } from '../utils/gitRepo.class';
import { routes } from '../utils/routes';
import { LoggerService } from './logger.service';
import { RemoteUtilsService } from './remote-utils.service';

@Injectable()
export class RemoteService {
  constructor(
    private readonly logger: LoggerService,
    private readonly remoteRepository: RemoteRepository,
    private readonly repoRepository: RepoRepository,
    private readonly folderRepository: FolderRepository,
    private readonly remoteUtilsService: RemoteUtilsService,
  ) { }

  async saveLocalRemotes() {
    await this.remoteRepository.truncate();
    const localRemotes = await this.listLocalRemotes();
    const createPromises = localRemotes.map((remote) => {
      return this.remoteRepository.create(remote);
    });
    const records = Promise.all(createPromises);
    return records;
  }

  async listLocalRemotes() {
    const folders = await this.folderRepository.all();
    const remotesPromises = folders.map(async (folder) => {
      const repositories = await this.repoRepository.findValidReposByFolderKey(
        folder.folderKey,
      );
      const remotesPromises = repositories.map(async (repository) => {
        const gitDirectory = routes.join(
          folder.folderPath,
          repository.directory,
        );
        const repo = new GitRepo(gitDirectory);
        const remotesData = await repo.getRemotes();
        const remotes = remotesData.map((gitRemote) => {
          return this.remoteUtilsService.gitRepoToBdRepo({
            gitRemote,
            folderKey: folder.folderKey,
            directory: repository.directory,
          });
        });
        return remotes;
      });

      const remotes = (await Promise.all(remotesPromises)).flatMap((r) => r);
      return remotes;
    });

    const remotes = (await Promise.all(remotesPromises)).flatMap((r) => r);
    return remotes;
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
        folderKey: remote.folderKey,
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
        folderKey: remote.folderKey,
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
      const folder = await this.folderRepository.findOneByKey(
        remoteToRemove.folderKey,
      );
      const gitDirectory = routes.join(
        folder.folderPath,
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
    const folder = await this.folderRepository.findOneByKey(remote.folderKey);
    const gitDirectory = routes.join(folder.folderPath, remote.directory);
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
