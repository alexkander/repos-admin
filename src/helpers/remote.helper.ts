import { GitRepo } from 'src/utils/gitRepo.class';
import { RemoteConstants } from '../constants/remote.constants';
import { Remote } from '../schemas/remote.schema';
import { GitRemoteType } from '../types/gitRepo.types';
import {
  FetchLogStatusType,
  RemoteFetchStatus,
  RemoteFilterQuery,
  RemoteUrlType,
} from '../types/remotes.type';
import { RepoHelper } from './repo.helper';

export class RemoteHelper {
  constructor() { }

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
    const gitDirectory = RepoHelper.getRealGitDirectory(directory);
    const gitRepo = new GitRepo(gitDirectory);
    const result = await gitRepo
      .fetchAll(name)
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
