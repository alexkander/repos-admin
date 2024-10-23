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

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GitBranchType extends GitReferenceType {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GitTagType extends GitReferenceType {}
