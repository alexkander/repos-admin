import { RepoService } from './repo.service';

export class RepoController {
  protected readonly repoService = new RepoService();

  sync() {
    return this.repoService.sync({
      doFetch: false,
      syncBranches: false,
      syncRemotes: false,
      syncTags: false,
    });
  }

  getAllRepos() {
    return this.repoService.getAllRepos();
  }

  getRepoById(id: string) {
    return this.repoService.getRepoById(id);
  }
}

export const repoController = new RepoController();
