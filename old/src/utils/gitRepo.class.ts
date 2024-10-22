import simpleGit from 'simple-git';
import { BranchConstants } from '../constants/branch.constants';
import {
  GitBranchType,
  GitReferenceType,
  GitRemoteType,
  GitTagType,
} from '../types/gitRepo.types';

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

  async getBranches(): Promise<GitBranchType[]> {
    const remotes = await this.getRemotes();
    const remotesNames = remotes.map(({ name }) => name);
    const branchesInfo = await this.handler.branch();
    const branches = Object.values(branchesInfo.branches).map((branch) => {
      const remoteName = remotesNames.find((remoteName) => {
        const remotePrefix = this.getRemoteBranchName(remoteName, '');
        return branch.name.startsWith(remotePrefix);
      });
      const remotePrefix = this.getRemoteBranchName(remoteName, '');
      const largeName = branch.name;
      const shortName = remoteName
        ? largeName.substring(remotePrefix.length)
        : largeName;
      const commit = branch.commit;

      const result: GitBranchType = {
        shortName,
        largeName,
        remoteName: remoteName,
        commit,
      };

      return result;
    });
    const promises = branches.map(async (branch) => {
      branch.backedUp = await this.isReferenceBackedUp(branch, branches);
    });
    await Promise.all(promises);
    return branches;
  }

  async isReferenceBackedUp(
    ref: GitReferenceType,
    references: GitReferenceType[],
  ) {
    const backedUp = await this.isRemoteReferenceBackedUp(ref, references);
    if (!backedUp) {
      if (ref.remoteName) {
        return await this.isLocalReferenceBackedUp(ref, references);
      }
    }
    return backedUp;
  }

  async isLocalReferenceBackedUp(
    remoteRef: GitReferenceType,
    references: GitReferenceType[],
  ) {
    const localRef = references.find(
      (lb) => !lb.remoteName && lb.shortName === remoteRef.shortName,
    );
    if (localRef?.commit) {
      return await this.isDescendent(remoteRef.commit, localRef.commit);
    }
    return true;
  }

  async isRemoteReferenceBackedUp(
    ref: GitReferenceType,
    references: GitReferenceType[],
  ) {
    const remoteReferences = references.filter(
      (rr) =>
        rr.remoteName &&
        rr.remoteName !== ref.remoteName &&
        rr.shortName === ref.shortName,
    );
    for (const remoteRef of remoteReferences) {
      const isDescendent = await this.isDescendent(
        remoteRef?.commit,
        ref.commit,
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

  async listRemoteTags(remoteName: string) {
    const lines = await this.handler.raw(['ls-remote', '--tags', remoteName]);

    return lines
      .trim()
      .split('\n')
      .map((line) => {
        const [commit, shortName] = line.split('\trefs/tags/');
        const largeName = `${remoteName}::${shortName}`;
        const result: GitTagType = {
          remoteName,
          commit,
          largeName,
          shortName,
        };
        return result;
      });
  }

  async listLocalTags() {
    const lines = await this.handler.raw(['show-ref', '--tags']);
    return lines
      .trim()
      .split('\n')
      .map((line) => {
        const [commit, shortName] = line.split(' refs/tags/');
        const largeName = `::${shortName}`;
        const result: GitTagType = { commit, shortName, largeName };
        return result;
      });
  }

  async getTags(pRemoteNames?: string[]): Promise<GitTagType[]> {
    const remoteNames = await (async () => {
      if (pRemoteNames) {
        return pRemoteNames;
      }
      const remotes = await this.getRemotes();
      return remotes.map((r) => r.name);
    })();
    const remotesTagsPromises = remoteNames.map((remoteName) =>
      this.listRemoteTags(remoteName),
    );

    const tagsPromises = (() => {
      if (pRemoteNames) return remotesTagsPromises;
      return [this.listLocalTags(), ...remotesTagsPromises];
    })();

    const tagsGroups = await Promise.all(tagsPromises);
    const tags = tagsGroups.flatMap((group) => group);

    const promises = tags.map(async (tag) => {
      tag.backedUp = await this.isReferenceBackedUp(tag, tags);
    });

    await Promise.all(promises);

    return tags;
  }

  async getBranchesFromRemotes(remoteNames: string[]) {
    const promises = remoteNames.map((r) => this.listRemoteBranches(r));
    const branchesResults = await Promise.all(promises);
    return branchesResults.flatMap((r) => r);
  }

  checkout(branchName: string, commit?: string) {
    if (commit) {
      return this.handler.checkoutBranch(branchName, commit);
    }
    return this.handler.checkout(branchName);
  }

  push(remoteName: string, branchName: string) {
    return this.handler.push(remoteName, branchName);
  }

  pull(remoteName: string, branchName: string) {
    return this.handler.pull(remoteName, branchName);
  }

  deleteLocalBranch(branchName: string) {
    return this.handler.deleteLocalBranch(branchName);
  }

  addRemote(remoteName: string, url: string) {
    return this.handler.addRemote(remoteName, url);
  }
}
