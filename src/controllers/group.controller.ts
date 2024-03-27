import { Controller, Get, Post } from '@nestjs/common';
import { GroupService } from '../services/group.service';

@Controller('group')
export class GroupController {
  constructor(private readonly remoteService: GroupService) { }

  @Get('/')
  list() {
    return this.remoteService.list();
  }

  @Get('/listGroupsFromRemotes')
  listGroupsFromRemotes() {
    return this.remoteService.listGroupsFromRemotes();
  }

  @Post('/saveGroupsFromRemote')
  saveGroupsFromRemote() {
    return this.remoteService.saveGroupsFromRemote();
  }
}
