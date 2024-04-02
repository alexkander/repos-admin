import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { RepoControllerConstants } from '../constants/repo.constants';
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

  @Get('/compareWith/*')
  compareWith(@Req() req?: Request) {
    const repos = req.params['0'];
    const regex = new RegExp(RepoControllerConstants.compareWithExtractor);
    const matches = regex.exec(repos);
    if (!matches) {
      throw new BadRequestException('bad request');
    }
    const [, folderKeyFrom, directoryFrom, folderKeyTo, directoryTo] = matches;
    return this.repoService.compareRepos({
      folderKeyFrom,
      directoryFrom,
      folderKeyTo,
      directoryTo,
    });
  }
}
