import { Injectable } from '@nestjs/common';
import { Remote } from 'src/schemas/remote.schema';
import { RemoteConstants } from '../constants/remote.constants';
import { BranchRepository } from '../repositories/branch.repository';
import { FolderRepository } from '../repositories/folder.repository';
import { RemoteRepository } from '../repositories/remote.repository';
import { RepoRepository } from '../repositories/repo.repository';
import { GitRepoService } from './gitRepo.service';
import { RemoteUrlType } from 'src/types/remotes.type';

@Injectable()
export class RemoteService {
  constructor(
    private readonly remoteRepository: RemoteRepository,
    private readonly repoRepository: RepoRepository,
    private readonly folderRepository: FolderRepository,
    private readonly branchRepository: BranchRepository,
    private readonly gitRepoService: GitRepoService,
  ) { }

  list() {
    return this.remoteRepository.find();
  }

  async listLocalRemotes() {
    const folders = await this.folderRepository.find();
    const remotesPromises = folders.map(async (folder) => {
      const repositories = await this.repoRepository.getValidReposByFolderKey(
        folder.folderKey,
      );
      const remotesPromises = repositories.map(async (repository) => {
        const repo = this.gitRepoService.getRepoFrom(
          folder.forderPath,
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
    await this.remoteRepository.deleteMany();
    const localRemotes = await this.listLocalRemotes();
    const createPromises = localRemotes.map((remote) => {
      return this.remoteRepository.create(remote);
    });
    const records = Promise.all(createPromises);
    return records;
  }

  async parseRemotes() {
    const remotes = await this.remoteRepository.find();
    const promises = remotes.map(async ({ _id, ...remote }) => {
      const { urlType, targetHost, targetGroup, targetName } =
        this.parseTargetInfo(remote);
      remote.urlType = urlType;
      remote.targetHost = targetHost;
      remote.targetGroup = targetGroup;
      remote.targetName = targetName
        ? this.normalizeTargetName(targetName)
        : null;
      return this.remoteRepository.update(_id, remote);
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

  async compareRemotes(params: {
    folderKey: string;
    remoteFrom: string;
    remoteTo: string;
    directory: string;
  }) {
    const [remotes, branches] = await Promise.all([
      this.remoteRepository.find({
        folderKey: params.folderKey,
        directory: params.directory,
        name: { $in: [params.remoteFrom, params.remoteTo] },
      }),
      this.branchRepository.find({
        folderKey: params.folderKey,
        directory: params.directory,
        remote: { $in: [params.remoteFrom, params.remoteTo] },
      }),
    ]);

    const remoteFrom = remotes.find(({ name }) => name === params.remoteFrom);
    const remoteTo = remotes.find(({ name }) => name === params.remoteTo);

    const branchesFrom = branches
      .filter(({ remote }) => remote === params.remoteFrom)
      .map(({ largeName }) => largeName);

    const branchesTo = branches
      .filter(({ remote }) => remote === params.remoteTo)
      .map(({ largeName }) => largeName);

    return { params, remoteFrom, remoteTo, branchesFrom, branchesTo };
  }

  async getNotSynchedRemotes(targetHost: string, targetGroup: string) {
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
      folder.forderPath,
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
