import { Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { RemoteService } from '../services/remote.service';

@Controller('remote')
export class RemoteController {
  constructor(private readonly remoteService: RemoteService) { }

  @Get('/')
  list() {
    return this.remoteService.list();
  }

  @Get('/listLocalRemotes')
  listLocalRemotes() {
    return this.remoteService.listLocalRemotes();
  }

  @Post('/saveLocalRemotes')
  saveLocalRemotes() {
    return this.remoteService.saveLocalRemotes();
  }

  @Post('/parseRemotes')
  parseRemotes() {
    return this.remoteService.parseRemotes();
  }

  @Get('/compareRemotes/:folderKey/:remotes/*')
  compareRemotes(@Req() req: Request) {
    const { folderKey, remotes } = req.params;
    const [remoteFrom, remoteTo] = remotes.split(':');
    const directory = req.params['0'];
    return this.remoteService.compareRemotes({
      folderKey,
      remoteFrom,
      remoteTo,
      directory,
    });
  }

  @Get('/:host/:group/notSynchedRemotes')
  getNotSynchedRemotes(
    @Param('host') host: string,
    @Param('group') group: string,
  ) {
    return this.remoteService.getNotSynchedRemotes(host, group);
  }
}
