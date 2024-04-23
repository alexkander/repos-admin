import simpleGit from 'simple-git';
import { BranchConstants } from '../constants/branch.constants';
import { GitBranchType, GitRemoteType } from '../types/gitRepo.types';

export class GitRepo {
  private handler: ReturnType<typeof simpleGit>;

  constructor(private rootDirectory: string) {
    this.handler = simpleGit(this.rootDirectory);
  }

  getRemoteBranchName(remoteName: string, branchName: string) {
    return `${BranchConstants.remotePrefix}${remoteName}/${branchName}`;
  }

  async isRepo() {
    return await this.handler.checkIsRepo();
  }

  async getRemotes() {
    const remotesData = await this.handler.getRemotes(true);
    const remotes = remotesData.map((item) => {
      const rare = item.refs.fetch !== item.refs.push;
      const result: GitRemoteType = {
        name: item.name,
        url: item.refs.fetch,
        refs: item.refs,
        rare,
      };
      return result;
    });
    return remotes;
  }

  async getBranches() {
    const remotes = await this.getRemotes();
    const remotesNames = remotes.map(({ name }) => name);
    const branchesInfo = await this.handler.branch();
    const branches = Object.values(branchesInfo.branches).map((branch) => {
      const remote = remotesNames.find((remoteName) => {
        const remotePrefix = this.getRemoteBranchName(remoteName, '');
        return branch.name.startsWith(remotePrefix);
      });
      const remotePrefix = this.getRemoteBranchName(remote, '');
      const largeName = branch.name;
      const shortName = remote
        ? largeName.substring(remotePrefix.length)
        : largeName;
      const commit = branch.commit;

      const result: GitBranchType = {
        shortName,
        largeName,
        remote,
        commit,
      };

      return result;
    });
    const promise = branches.map(async (branch) => {
      branch.backedUp = await this.isRemoteBackedUp(branch, branches);
      if (!branch.backedUp) {
        if (branch.remote) {
          branch.backedUp = await this.isLocalBackedUp(branch, branches);
        }
      }
    });
    await Promise.all(promise);
    return branches;
  }

  async isLocalBackedUp(
    remoteBranch: GitBranchType,
    branches: GitBranchType[],
  ) {
    const localBranch = branches.find(
      (lb) => !lb.remote && lb.shortName === remoteBranch.shortName,
    );
    if (localBranch?.commit) {
      return await this.isDescendent(remoteBranch.commit, localBranch.commit);
    }
    return true;
  }

  async isRemoteBackedUp(branch: GitBranchType, branches: GitBranchType[]) {
    const remoteBranches = branches.filter(
      (rb) =>
        rb.remote &&
        rb.remote !== branch.remote &&
        rb.shortName === branch.shortName,
    );
    for (const remoteBranch of remoteBranches) {
      const isDescendent = await this.isDescendent(
        remoteBranch?.commit,
        branch.commit,
      );
      if (isDescendent) {
        return true;
      }
    }
    return false;
  }

  async fetchAllRemotes() {
    const remotes = await this.getRemotes();
    const fetchPromises = remotes.map(async (remote) => {
      return this.fetchAll(remote.name);
    });
    const fetchResults = await Promise.allSettled(fetchPromises);
    const fetchResultsMap = remotes.map((remote, idx) => {
      return {
        remote: remote.name,
        result: fetchResults[idx],
      };
    });
    return fetchResultsMap;
  }

  fetchAll(remoteName: string) {
    return this.handler.raw(['fetch', remoteName, '--tags', '-v']);
  }

  async isDescendent(childCommit: string, parentCommit: string) {
    if (parentCommit === childCommit) {
      return true;
    }
    const ancestor = await this.handler.raw([
      `merge-base`,
      parentCommit,
      childCommit,
    ]);
    return ancestor.startsWith(parentCommit);
  }

  removeRemote(remoteName: string) {
    return this.handler.removeRemote(remoteName);
  }

  async listRemoteBranches(remoteName: string) {
    const lines = await this.handler.raw(['ls-remote', '--heads', remoteName]);

    return lines
      .trim()
      .split('\n')
      .map((line) => {
        const [commit, refName] = line.split('\trefs/heads/');
        return { remoteName, commit, refName };
      });
  }

  async getBranchesFromRemotes(remoteNames: string[]) {
    const promises = remoteNames.map((r) => this.listRemoteBranches(r));
    const branchesResults = await Promise.all(promises);
    return branchesResults.flatMap((r) => r);
  }

  checkout(branchName: string, commit: string) {
    return this.handler.checkoutBranch(branchName, commit);
  }

  push(remoteName: string, branchName: string) {
    return this.handler.push(remoteName, branchName);
  }
}
