import { Tag } from 'src/schemas/tag.schema';
import { RemoteConstants } from '../constants/remote.constants';
import { Remote } from '../schemas/remote.schema';
import {
  GitBranchType,
  GitRemoteType,
  GitTagType,
} from '../types/gitRepo.types';
import {
  FetchLogStatusType,
  RemoteFetchStatus,
  RemoteFilterQuery,
  RemoteUrlType
} from '../types/remotes.type';
import { GitRepo } from '../utils/gitRepo.class';
import { RepoHelper } from './repo.helper';
import { Branch } from 'src/schemas/branch.schema';

export class RemoteHelper {
  constructor() { }

  static async getRemoteDataFromDirectory({
    directory,
    remoteName,
  }: {
    directory: string;
    remoteName: string;
  }): Promise<Remote> {
    const gitRepo = RepoHelper.getGitRepo(directory);
    const remotes = await gitRepo.getRemotes();
    const gitRemote = remotes.find((r) => r.name === remoteName);
    const remoteData = this.gitRemoteToRemote({
      directory,
      gitRemote,
    });
    return remoteData;
  }

  static gitRemoteToRemote({
    gitRemote,
    directory,
  }: {
    gitRemote: GitRemoteType;
    directory: string;
  }): Remote {
    const { urlType, targetHost, targetGroup, targetName } =
      this.parseTargetInfo(gitRemote.url);
    return {
      ...gitRemote,
      directory,
      urlType,
      targetHost,
      targetGroup,
      targetName,
    };
  }

  static parseTargetInfo(url: string) {
    const array = [
      { regexp: RemoteConstants.UrlRegex.https, urlType: RemoteUrlType.HTTPS },
      { regexp: RemoteConstants.UrlRegex.http, urlType: RemoteUrlType.HTTP },
      { regexp: RemoteConstants.UrlRegex.ssh, urlType: RemoteUrlType.SSH },
      { regexp: RemoteConstants.UrlRegex.git, urlType: RemoteUrlType.GIT },
    ];
    for (const { regexp, urlType } of array) {
      const matches = url.match(new RegExp(regexp));
      if (matches) {
        const [, targetHost, targetGroup, targetNameRaw] = matches;
        const targetName = this.normalizeTargetName(targetNameRaw);
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

  static async fetchRemote({ directory, name }: RemoteFilterQuery) {
    const gitRepo = RepoHelper.getGitRepo(directory);
    return this.fetchRemoteFromGitRepo(gitRepo, name);
  }

  static async fetchRemoteFromGitRepo(gitRepo: GitRepo, remoteName: string) {
    const result = await gitRepo
      .fetchAll(remoteName)
      .then((response) => ({
        status: FetchLogStatusType.SUCCESS,
        result: response,
      }))
      .catch((error) => ({ status: FetchLogStatusType.ERROR, result: error }));
    const status: RemoteFetchStatus = {
      fetchStatus: result.status,
      fetchResult: result.result,
    };
    return status;
  }

  static normalizeTargetName(targetNameRaw: string) {
    const len = targetNameRaw.length - RemoteConstants.gitSuffix.length;
    const targetName = targetNameRaw.endsWith(RemoteConstants.gitSuffix)
      ? targetNameRaw.substring(0, len)
      : targetNameRaw;
    return targetName;
  }
}
