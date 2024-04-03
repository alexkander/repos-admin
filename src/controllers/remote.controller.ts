import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { RemoteService } from '../services/remote.service';

@Controller('remote')
export class RemoteController {
  constructor(private readonly remoteService: RemoteService) { }

  @Get('/listLocalRemotes')
  listLocalRemotes() {
    return this.remoteService.listLocalRemotes();
  }

  @Post('/saveLocalRemotes')
  saveLocalRemotes() {
    return this.remoteService.saveLocalRemotes();
  }

  @Get('/:host/:group/remotesLonelyBranchesByGroup')
  getRemotesLonelyBranchesByGroup(
    @Param('host') host: string,
    @Param('group') group: string,
  ) {
    return this.remoteService.remotesLonelyBranchesByGroup(host, group);
  }

  @Delete('/:host/:group/removeRemotesWithNoLonelyBranches')
  removeRemotesWithNoLonelyBranches(
    @Param('host') host: string,
    @Param('group') group: string,
  ) {
    return this.remoteService.removeRemotesWithNoLonelyBranches(host, group);
  }
}
