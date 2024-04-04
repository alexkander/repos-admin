import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { configuration } from './configuration/configuration';
import { FolderController } from './controllers/folder.controller';
import { GroupController } from './controllers/group.controller';
import { RemoteController } from './controllers/remote.controller';
import { RepoController } from './controllers/repo.controller';
import { FolderRepository } from './repositories/folder.repository';
import { GroupRepository } from './repositories/group.repository';
import { RemoteRepository } from './repositories/remote.repository';
import { RepoRepository } from './repositories/repo.repository';
import { Folder, FolderSchema } from './schemas/folder.schema';
import { Group, GroupSchema } from './schemas/group.schema';
import { Remote, RemoteSchema } from './schemas/remote.schema';
import { Repo, RepoSchema } from './schemas/repo.schema';
import { FolderService } from './services/folder.service';
import { GroupService } from './services/group.service';
import { LoggerService } from './services/logger.service';
import { RemoteService } from './services/remote.service';
import { RepoService } from './services/repo.service';
import { RemoteUtilsService } from './services/remote-utils.service';
import { SearchService } from './services/search.service';

@Module({
  imports: [
    MongooseModule.forRoot(configuration.DATABASE, { autoIndex: true }),
    MongooseModule.forFeature([
      { name: Folder.name, schema: FolderSchema },
      { name: Repo.name, schema: RepoSchema },
      { name: Remote.name, schema: RemoteSchema },
      { name: Group.name, schema: GroupSchema },
    ]),
  ],
  controllers: [
    FolderController,
    RepoController,
    RemoteController,
    GroupController,
  ],
  providers: [
    LoggerService,
    SearchService,
    FolderRepository,
    FolderService,
    RepoService,
    RepoRepository,
    RemoteRepository,
    RemoteService,
    RemoteUtilsService,
    GroupRepository,
    GroupService,
  ],
})
export class AppModule { }
