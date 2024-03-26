import { Controller, Get, Post } from '@nestjs/common';
import { RepoService } from 'src/services/repo.service';

@Controller('repository')
export class RepoController {
  constructor(private readonly repoService: RepoService) {}

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
}
