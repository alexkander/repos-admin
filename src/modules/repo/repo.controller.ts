import { RepoService } from './repo.service';

export class RepoController {
  protected readonly repoService = new RepoService();

  find() {
    return this.repoService.find();
  }

  sync() {
    return this.repoService.sync({
      doFetch: false,
      syncBranches: false,
      syncRemotes: false,
      syncTags: false,
    });
  }
}
