import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { configuration } from './configuration/configuration';
import { BranchController } from './controllers/branch.controller';
import { FolderController } from './controllers/folder.controller';
import { GroupController } from './controllers/group.controller';
import { RemoteController } from './controllers/remote.controller';
import { RepoController } from './controllers/repo.controller';
import { BranchRepository } from './repositories/branch.repository';
import { FetchLogRepository } from './repositories/fetchLog.repository';
import { FolderRepository } from './repositories/folder.repository';
import { GroupRepository } from './repositories/group.repository';
import { RemoteRepository } from './repositories/remote.repository';
import { RepoRepository } from './repositories/repo.repository';
import { Branch, BranchSchema } from './schemas/branch.schema';
import { FetchLog, FetchLogSchema } from './schemas/fetchLog.schema';
import { Folder, FolderSchema } from './schemas/folder.schema';
import { Group, GroupSchema } from './schemas/group.schema';
import { Remote, RemoteSchema } from './schemas/remote.schema';
import { Repo, RepoSchema } from './schemas/repo.schema';
import { BranchService } from './services/branch.service';
import { FolderService } from './services/folder.service';
import { GitRepoService } from './services/gitRepo.service';
import { GroupService } from './services/group.service';
import { LoggerService } from './services/logger.service';
import { RemoteService } from './services/remote.service';
import { RepoService } from './services/repo.service';

@Module({
  imports: [
    MongooseModule.forRoot(configuration.DATABASE, { autoIndex: true }),
    MongooseModule.forFeature([
      { name: Folder.name, schema: FolderSchema },
      { name: Repo.name, schema: RepoSchema },
      { name: Remote.name, schema: RemoteSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Group.name, schema: GroupSchema },
      { name: FetchLog.name, schema: FetchLogSchema },
    ]),
  ],
  controllers: [
    FolderController,
    RepoController,
    RemoteController,
    BranchController,
    GroupController,
  ],
  providers: [
    LoggerService,
    FetchLogRepository,
    FolderRepository,
    FolderService,
    RepoService,
    RepoRepository,
    RemoteRepository,
    RemoteService,
    GitRepoService,
    BranchRepository,
    BranchService,
    GroupRepository,
    GroupService,
  ],
})
export class AppModule { }
