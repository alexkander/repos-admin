export type ReposComparisonParams = {
  directoryFrom: string;
  directoryTo: string;
};

export enum SyncActionType {
  base = 'base',
  all = 'all',
  remotes = 'remotes',
  branches = 'branches',
}
