import { Request } from 'express';
import { Controller, Get, Req } from '@nestjs/common';
import { TagsService } from 'src/services/tags.service';

@Controller('tag')
export class TagsController {
  constructor(private readonly tagsService: TagsService) { }

  @Get('/list/*')
  listTags(@Req() req?: Request) {
    const directory = req.params['0'];
    return this.tagsService.listTags({ directory });
  }
}
