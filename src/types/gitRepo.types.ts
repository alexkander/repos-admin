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
  remote: string;
  commit: string;
  remoteSynched?: boolean;
  backedUp?: boolean;
};

export type GitTagType = {
  commit: string;
  shortName: string;
  largeName: string;
  remoteName?: string;
  remoteSynched?: boolean;
};
