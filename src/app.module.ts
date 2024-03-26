import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { configuration } from './configuration/configuration';
import { FolderController } from './controllers/folder.controller';
import { RepoController } from './controllers/repo.controller';
import { FolderRepository } from './repositories/folder.repository';
import { RepoRepository } from './repositories/repo.repository';
import { Folder, FolderSchema } from './schemas/folder.schema';
import { Repo, RepoSchema } from './schemas/repo.schema';
import { FolderService } from './services/folder.service';
import { RepoService } from './services/repo.service';
import { Remote, RemoteSchema } from './schemas/remote.schema';
import { RemoteController } from './controllers/remote.controller';
import { RemoteRepository } from './repositories/remote.repository';
import { RemoteService } from './services/remote.service';
import { GitRepoService } from './services/gitRepo.service';

@Module({
  imports: [
    MongooseModule.forRoot(configuration.DATABASE, { autoIndex: true }),
    MongooseModule.forFeature([
      { name: Folder.name, schema: FolderSchema },
      { name: Repo.name, schema: RepoSchema },
      { name: Remote.name, schema: RemoteSchema },
    ]),
  ],
  controllers: [FolderController, RepoController, RemoteController],
  providers: [
    FolderRepository,
    FolderService,
    RepoService,
    RepoRepository,
    RemoteRepository,
    RemoteService,
    GitRepoService,
  ],
})
export class AppModule { }
