import { Controller, Get, Post, Query } from '@nestjs/common';
import { RepoService } from '../services/repo.service';

@Controller('repo')
export class RepoController {
  constructor(private readonly repoService: RepoService) { }

  @Get('/listLocalRepos')
  listLocalRepos() {
    return this.repoService.listLocalRepos();
  }

  @Post('/saveLocalRepos')
  saveLocalRepos() {
    return this.repoService.saveLocalRepos();
  }

  @Post('/gitFetchAllRemotes')
  gitFetchAllRemotes(@Query('all') all?: string) {
    return this.repoService.fetchAllRepos(all !== 'yes');
  }
}
