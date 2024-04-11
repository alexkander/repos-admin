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

export enum RemoteGroupType {
  all = 'all',
  fetchStatusError = 'fetchStatusError',
  notFetched = 'notFetched',
}

export type RepoFilterQuery = {
  directory: string;
};

export type RemoteFilterQuery = {
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

export enum SyncRemoteActionType {
  base = 'base',
  all = 'all',
  branches = 'branches',
}
