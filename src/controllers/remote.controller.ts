import { Controller, Get, Post } from '@nestjs/common';
import { RemoteService } from 'src/services/remote.service';

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
}
