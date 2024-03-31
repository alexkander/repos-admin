import { Controller, Get, Post } from '@nestjs/common';
import { GroupService } from '../services/group.service';

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) { }

  @Get('/')
  list() {
    return this.groupService.list();
  }

  @Get('/listGroupsFromRemotes')
  listGroupsFromRemotes() {
    return this.groupService.listGroupsFromRemotes();
  }

  @Post('/saveGroupsFromRemote')
  saveGroupsFromRemote() {
    return this.groupService.saveGroupsFromRemote();
  }
}
