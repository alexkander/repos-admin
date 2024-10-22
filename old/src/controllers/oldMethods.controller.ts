import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { OldMethodsService } from 'src/services/oldMethods.service';
import { RepoControllerConstants } from '../constants/repo.constants';

@Controller('old-methods')
export class OldMethodsController {
  constructor(private readonly oldMethodService: OldMethodsService) { }

  @Get('/compareWith/*')
  compareWith(@Req() req?: Request) {
    const repos = req.params['0'];
    const regex = new RegExp(RepoControllerConstants.compareWithExtractor);
    const matches = regex.exec(repos);
    if (!matches) {
      throw new BadRequestException('bad request');
    }
    const [, directoryFrom, directoryTo] = matches;
    return this.oldMethodService.compareRepos({
      directoryFrom,
      directoryTo,
    });
  }

  @Get('/:host/:group/remotesLonelyBranchesByGroup')
  getRemotesLonelyBranchesByGroup(
    @Param('host') host: string,
    @Param('group') group: string,
  ) {
    return this.oldMethodService.remotesLonelyBranchesByGroup(host, group);
  }

  @Delete('/:host/:group/removeRemotesWithNoLonelyBranches')
  removeRemotesWithNoLonelyBranches(
    @Param('host') host: string,
    @Param('group') group: string,
  ) {
    return this.oldMethodService.removeRemotesWithNoLonelyBranches(host, group);
  }
}
