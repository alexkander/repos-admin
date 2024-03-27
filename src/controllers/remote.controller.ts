import { Controller, Get, Post, Req } from '@nestjs/common';
import { RemoteService } from '../services/remote.service';
import { Request } from 'express';

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
}
