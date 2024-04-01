import { Controller, Get, Post } from '@nestjs/common';
import { FolderService } from '../services/folder.service';

@Controller('folder')
export class FolderController {
  constructor(private readonly folderService: FolderService) { }

  @Get('/listEnvFolder')
  listEnvFolder() {
    return this.folderService.listEnvFolder();
  }

  @Post('/saveEnvFolders')
  saveLocalRepos() {
    return this.folderService.saveEnvFolders();
  }
}
