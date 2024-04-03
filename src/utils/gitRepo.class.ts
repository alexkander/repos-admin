import simpleGit from 'simple-git';
import { BranchConstants } from '../constants/branch.constants';
import { GitRemoteType } from '../types/gitRepo.types';

export class GitRepo {
  private handler: ReturnType<typeof simpleGit>;

  constructor(private rootDirectory: string) {
    this.handler = simpleGit(this.rootDirectory);
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
    const remotesNames = (await this.getRemotes()).map(({ name }) => name);
    const branchesInfo = await this.handler.branch();
    const branches = Object.values(branchesInfo.branches).map((branch) => {
      const isRemote = branch.name.startsWith(BranchConstants.remotePrefix);
      const remote = remotesNames.find((remoteName) => {
        const remotePrefix = `${BranchConstants.remotePrefix}${remoteName}`;
        return branch.name.startsWith(remotePrefix);
      });
      const remotePrefix = `${BranchConstants.remotePrefix}${remote}`;
      const largeName = branch.name;
      const shortName = remote
        ? largeName.substring(remotePrefix.length + 1)
        : largeName;
      const commit = branch.commit;

      return {
        shortName,
        largeName,
        isRemote,
        remote,
        commit,
      };
    });
    return branches;
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
  async isDescendent(chilpCommit: string, parentCommit: string) {
    if (parentCommit === chilpCommit) {
      return true;
    }
    const ancestor = await this.handler.raw([
      `merge-base`,
      parentCommit,
      chilpCommit,
    ]);
    return ancestor.startsWith(parentCommit);
  }

  removeRemote(remoteName: string) {
    return this.handler.removeRemote(remoteName);
  }
}