import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req
} from '@nestjs/common';
import { Request } from 'express';
import { RepoControllerConstants } from '../constants/repo.constants';
import { RepoService } from '../services/repo.service';
import { Types } from 'mongoose';

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

  @Put('/:id/refresh')
  refresh(@Param('id') id: Types.ObjectId) {
    return this.repoService.refresh(id);
  }

  @Post('/gitFetchAllRemotes/:type')
  gitFetchAllRemotes(@Param('type') type: string) {
    return this.repoService.fetchAllRemotesFromRepo(type);
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
