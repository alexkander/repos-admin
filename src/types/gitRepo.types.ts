export type GitRemoteType = {
  name: string;
  url: string;
  refs: {
    fetch: string;
    push: string;
  };
  rare: boolean;
};

export type GitBranchType = {
  shortName: string;
  largeName: string;
  isRemote: boolean;
  remote: string;
  commit: string;
};
