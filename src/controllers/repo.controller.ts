import { Controller, Get, Post } from '@nestjs/common';
import { RepoService } from 'src/services/repo.service';

@Controller('repository')
export class RepoController {
  constructor(private readonly repoService: RepoService) {}

  @Get('/listDirectories')
  listDirectories() {
    return this.repoService.listDirectories();
  }

  @Post('/saveLocalRepos')
  saveLocalRepos() {
    return this.repoService.saveLocalRepos();
  }
}
