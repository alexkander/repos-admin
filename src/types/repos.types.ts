export type ReposComparisonParams = {
  directoryFrom: string;
  directoryTo: string;
};

export type SyncRepoOptions = {
  syncRemotes: boolean;
  syncBranches: boolean;
  doFetch: boolean;
};
