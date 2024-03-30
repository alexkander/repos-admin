import { Controller, Get, Post } from '@nestjs/common';
import { RepoService } from '../services/repo.service';

@Controller('repo')
export class RepoController {
  constructor(private readonly repoService: RepoService) { }

  @Get('/')
  list() {
    return this.repoService.list();
  }

  @Get('/listLocalRepos')
  listLocalRepos() {
    return this.repoService.listLocalRepos();
  }

  @Post('/saveLocalRepos')
  saveLocalRepos() {
    return this.repoService.saveLocalRepos();
  }

  @Post('/countRemotes')
  countRemotes() {
    return this.repoService.countRemotes();
  }

  @Post('/gitFetchAllRemotes')
  gitFetchAllRemotes() {
    return this.repoService.gitFetchAllRemotes();
  }
}
