import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { configuration } from './configuration/configuration';
import { GroupController } from './controllers/group.controller';
import { RemoteController } from './controllers/remote.controller';
import { RepoController } from './controllers/repo.controller';
import { GroupRepository } from './repositories/group.repository';
import { RemoteRepository } from './repositories/remote.repository';
import { RepoRepository } from './repositories/repo.repository';
import { Group, GroupSchema } from './schemas/group.schema';
import { Remote, RemoteSchema } from './schemas/remote.schema';
import { Repo, RepoSchema } from './schemas/repo.schema';
import { GroupService } from './services/group.service';
import { LoggerService } from './services/logger.service';
import { RemoteService } from './services/remote.service';
import { RepoService } from './services/repo.service';
import { SearchService } from './services/search.service';
import { Branch, BranchSchema } from './schemas/branch.schema';
import { BranchRepository } from './repositories/branch.repository';

@Module({
  imports: [
    MongooseModule.forRoot(configuration.DATABASE, { autoIndex: true }),
    MongooseModule.forFeature([
      { name: Repo.name, schema: RepoSchema },
      { name: Remote.name, schema: RemoteSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Group.name, schema: GroupSchema },
    ]),
  ],
  controllers: [RepoController, RemoteController, GroupController],
  providers: [
    LoggerService,
    SearchService,
    RepoService,
    RepoRepository,
    RemoteRepository,
    RemoteService,
    BranchRepository,
    GroupRepository,
    GroupService,
  ],
})
export class AppModule { }
