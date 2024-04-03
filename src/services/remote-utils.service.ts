import { Injectable } from '@nestjs/common';
import { GitRemoteType } from 'src/types/gitRepo.types';
import { RemoteConstants } from '../constants/remote.constants';
import { RemoteUrlType } from '../types/remotes.type';
import { Remote } from 'src/schemas/remote.schema';

@Injectable()
export class RemoteUtilsService {
  constructor() { }

  gitRepoToBdRepo({
    gitRemote,
    directory,
    folderKey,
  }: {
    gitRemote: GitRemoteType;
    folderKey: string;
    directory: string;
  }): Remote {
    const { urlType, targetHost, targetGroup, targetName } =
      this.parseTargetInfo(gitRemote.url);
    return {
      ...gitRemote,
      folderKey,
      directory,
      urlType,
      targetHost,
      targetGroup,
      targetName,
    };
  }

  parseTargetInfo(url: string) {
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

  normalizeTargetName(targetNameRaw: string) {
    const targetName = targetNameRaw.endsWith(RemoteConstants.gitSuffix)
      ? targetNameRaw.substring(
          0,
          targetNameRaw.length - RemoteConstants.gitSuffix.length,
        )
      : targetNameRaw;
    return targetName;
  }
}
