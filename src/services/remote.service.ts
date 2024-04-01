import { Injectable } from '@nestjs/common';
import { RemoteConstants } from '../constants/remote.constants';
import { FolderRepository } from '../repositories/folder.repository';
import { RemoteRepository } from '../repositories/remote.repository';
import { RepoRepository } from '../repositories/repo.repository';
import { Remote } from '../schemas/remote.schema';
import { RemoteTargetInfo, RemoteUrlType } from '../types/remotes.type';
import { GitRepoService } from './gitRepo.service';

@Injectable()
export class RemoteService {
  constructor(
    private readonly remoteRepository: RemoteRepository,
    private readonly repoRepository: RepoRepository,
    private readonly folderRepository: FolderRepository,
    private readonly gitRepoService: GitRepoService,
  ) { }

  async listLocalRemotes() {
    const folders = await this.folderRepository.all();
    const remotesPromises = folders.map(async (folder) => {
      const repositories = await this.repoRepository.findValidReposByFolderKey(
        folder.folderKey,
      );
      const remotesPromises = repositories.map(async (repository) => {
        const repo = this.gitRepoService.getRepoFrom(
          folder.folderPath,
          repository.directory,
        );
        const remotesData = await repo.getRemotes();
        const remotes = remotesData.map((item) => {
          return {
            folderKey: folder.folderKey,
            directory: repository.directory,
            ...item,
          };
        });
        return remotes;
      });

      const remotes = (await Promise.all(remotesPromises)).flatMap((r) => r);
      return remotes;
    });

    const remotes = (await Promise.all(remotesPromises)).flatMap((r) => r);
    return remotes;
  }

  async saveLocalRemotes() {
    await this.remoteRepository.truncate();
    const localRemotes = await this.listLocalRemotes();
    const createPromises = localRemotes.map((remote) => {
      return this.remoteRepository.create(remote);
    });
    const records = Promise.all(createPromises);
    return records;
  }

  async parseRemotes() {
    const remotes = await this.remoteRepository.all();
    const promises = remotes.map(async ({ _id, ...remote }) => {
      const { urlType, targetHost, targetGroup, targetName } =
        this.parseTargetInfo(remote);
      const data: RemoteTargetInfo = {
        urlType,
        targetGroup,
        targetHost,
        targetName: targetName ? this.normalizeTargetName(targetName) : null,
      };
      return this.remoteRepository.updateTargetInfoById(_id, data);
    });
    return await Promise.all(promises);
  }

  parseTargetInfo({ url }: { url: string }) {
    const array = [
      { regexp: RemoteConstants.UrlRegex.https, urlType: RemoteUrlType.HTTPS },
      { regexp: RemoteConstants.UrlRegex.http, urlType: RemoteUrlType.HTTP },
      { regexp: RemoteConstants.UrlRegex.ssh, urlType: RemoteUrlType.SSH },
      { regexp: RemoteConstants.UrlRegex.git, urlType: RemoteUrlType.GIT },
    ];
    for (const { regexp, urlType } of array) {
      const matches = url.match(regexp);
      if (matches) {
        const [, targetHost, targetGroup, targetName] = matches;
        return { urlType, targetHost, targetGroup, targetName };
      }
    }
    return {
      urlType: RemoteUrlType.UNKNOWN,
      targetHost: null,
      targetGroup: null,
      targetName: null,
    };
  }

  normalizeTargetName(targetNameRaw: string) {
    const targetName = targetNameRaw.endsWith(RemoteConstants.gitSufix)
      ? targetNameRaw.substring(
        0,
        targetNameRaw.length - RemoteConstants.gitSufix.length,
      )
      : targetNameRaw;
    return targetName;
  }

  async remotesLonelyBranchesByGroup(targetHost: string, targetGroup: string) {
    const remotes = await this.remoteRepository.findByHostGroup({
      targetHost,
      targetGroup,
    });

    const resultsRemotesPromises = remotes.map(async (remote) => {
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

    const groupRemotes = await Promise.all(resultsRemotesPromises);
    const notSynchedRemotes = groupRemotes.filter(
      (b) => b.noDescendantsBranches.length,
    );

    return {
      resultRemotesCount: groupRemotes.length,
      filterRemotesCount: notSynchedRemotes.length,
      filterRemotes: notSynchedRemotes,
    };
  }

  async getCompareSummaryBranches(remote: Remote) {
    const folder = await this.folderRepository.findOneByKey(remote.folderKey);
    const gitRepo = this.gitRepoService.getRepoFrom(
      folder.folderPath,
      remote.directory,
    );
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
