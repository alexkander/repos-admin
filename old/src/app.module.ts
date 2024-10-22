import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { configuration } from './configuration/configuration';
import { BranchController } from './controllers/branch.controller';
import { RemoteController } from './controllers/remote.controller';
import { RepoController } from './controllers/repo.controller';
import { TagsController } from './controllers/tags.controller';
import { BranchRepository } from './repositories/branch.repository';
import { RemoteRepository } from './repositories/remote.repository';
import { RepoRepository } from './repositories/repo.repository';
import { Branch, BranchSchema } from './schemas/branch.schema';
import { Remote, RemoteSchema } from './schemas/remote.schema';
import { Repo, RepoSchema } from './schemas/repo.schema';
import { BranchService } from './services/branch.service';
import { GitService } from './services/git.service';
import { LoggerService } from './services/logger.service';
import { RemoteService } from './services/remote.service';
import { RepoService } from './services/repo.service';
import { SearchService } from './services/search.service';
import { TagsService } from './services/tags.service';
import { Tag, TagSchema } from './schemas/tag.schema';
import { TagRepository } from './repositories/tag.repository';

@Module({
  imports: [
    MongooseModule.forRoot(configuration.DATABASE, { autoIndex: true }),
    MongooseModule.forFeature([
      { name: Repo.name, schema: RepoSchema },
      { name: Remote.name, schema: RemoteSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Tag.name, schema: TagSchema },
    ]),
  ],
  controllers: [
    RepoController,
    RemoteController,
    BranchController,
    TagsController,
  ],
  providers: [
    LoggerService,
    SearchService,
    RepoService,
    RepoRepository,
    RemoteRepository,
    RemoteService,
    BranchRepository,
    BranchService,
    TagsService,
    TagRepository,
    GitService,
  ],
})
export class AppModule { }
