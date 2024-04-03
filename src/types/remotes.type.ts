export enum FetchLogStatusType {
  SUCCESS = 'success',
  ERROR = 'error',
}

export enum RemoteUrlType {
  HTTPS = 'https',
  HTTP = 'http',
  GIT = 'git',
  SSH = 'ssh',
  UNKNOWN = 'unknown',
}

export type RepoFilterQuery = {
  folderKey: string;
  directory: string;
};

export type RemoteFilterQuery = {
  folderKey: string;
  directory: string;
  name: string;
};

export type RemoteFetchStatus = {
  fetchStatus: FetchLogStatusType;
  fetchResult: Record<string, any>;
};

export type HostGroupFilterQuery = {
  targetHost: string;
  targetGroup: string;
};
