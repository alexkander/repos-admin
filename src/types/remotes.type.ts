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

export type HostGroupFilterQuery = {
  targetHost: string;
  targetGroup: string;
};
