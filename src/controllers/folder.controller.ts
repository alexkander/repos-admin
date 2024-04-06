import {
  Body,
  Controller,
  Get,
  Post,
  Render,
  ValidationPipe,
} from '@nestjs/common';
import { FolderHelper } from 'src/helpers/folder.helper';
import { FolderService } from '../services/folder.service';
import { FolderCreatePayload } from 'src/dtos/folder.dto';

const fields = [
  { field: 'folderKey', text: 'key' },
  { field: 'folderPath', text: 'path' },
];

@Controller('folder')
export class FolderController {
  constructor(private readonly folderService: FolderService) { }

  @Get('/')
  @Render('folder/index.hbs')
  async tableFolder() {
    const searchQuery = { search: {}, sort: {} };
    const records = await this.folderService.searchRepos();
    const totalCount = await this.folderService.count();
    return { records, totalCount, searchQuery, errors: [], fields };
  }

  @Post('/')
  create(@Body(ValidationPipe) payload: FolderCreatePayload) {
    const folder = FolderHelper.folderCreatePayloadToFolder(payload);
    return this.folderService.create(folder);
  }

  @Get('/listEnvFolder')
  listEnvFolder() {
    return this.folderService.listEnvFolder();
  }

  @Post('/saveEnvFolders')
  saveLocalRepos() {
    return this.folderService.saveEnvFolders();
  }
}
