import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { configuration } from './configuration/configuration';
import { BranchController } from './controllers/branch.controller';
import { FolderController } from './controllers/folder.controller';
import { RemoteController } from './controllers/remote.controller';
import { RepoController } from './controllers/repo.controller';
import { BranchRepository } from './repositories/branch.repository';
import { FolderRepository } from './repositories/folder.repository';
import { RemoteRepository } from './repositories/remote.repository';
import { RepoRepository } from './repositories/repo.repository';
import { Branch, BranchSchema } from './schemas/branch.schema';
import { Folder, FolderSchema } from './schemas/folder.schema';
import { Remote, RemoteSchema } from './schemas/remote.schema';
import { Repo, RepoSchema } from './schemas/repo.schema';
import { BranchService } from './services/branch.service';
import { FolderService } from './services/folder.service';
import { GitRepoService } from './services/gitRepo.service';
import { RemoteService } from './services/remote.service';
import { RepoService } from './services/repo.service';
import { GroupController } from './controllers/group.controller';
import { Group, GroupSchema } from './schemas/group.schema';
import { GroupRepository } from './repositories/group.repository';
import { GroupService } from './services/group.service';

@Module({
  imports: [
    MongooseModule.forRoot(configuration.DATABASE, { autoIndex: true }),
    MongooseModule.forFeature([
      { name: Folder.name, schema: FolderSchema },
      { name: Repo.name, schema: RepoSchema },
      { name: Remote.name, schema: RemoteSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Group.name, schema: GroupSchema },
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
