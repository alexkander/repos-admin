export type GitRemoteType = {
  name: string;
  url: string;
  refs: {
    fetch: string;
    push: string;
  };
  rare: boolean;
};

export type GitReferenceType = {
  shortName: string;
  largeName: string;
  remoteName?: string;
  commit: string;
  remoteSynched?: boolean;
  backedUp?: boolean;
};

export interface GitBranchType extends GitReferenceType {}

export interface GitTagType extends GitReferenceType {}
