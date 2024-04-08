import { RemoteConstants } from '../constants/remote.constants';
import { Remote } from '../schemas/remote.schema';
import { GitRemoteType } from '../types/gitRepo.types';
import { RemoteUrlType } from '../types/remotes.type';

export class RemoteHelper {
  constructor() { }

  static gitRepoToBdRepo({
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

  static normalizeTargetName(targetNameRaw: string) {
    const len = targetNameRaw.length - RemoteConstants.gitSuffix.length;
    const targetName = targetNameRaw.endsWith(RemoteConstants.gitSuffix)
      ? targetNameRaw.substring(0, len)
      : targetNameRaw;
    return targetName;
  }
}
