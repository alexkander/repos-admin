export type ReposComparisonParams = {
  directoryFrom: string;
  directoryTo: string;
};

export enum SyncRepoActionType {
  base = 'base',
  all = 'all',
  remotes = 'remotes',
  branches = 'branches',
}
