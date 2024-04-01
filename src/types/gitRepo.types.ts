export type GitRemoteType = {
  name: string;
  url: string;
  refs: {
    fetch: string;
    push: string;
  };
  rare: boolean;
};
