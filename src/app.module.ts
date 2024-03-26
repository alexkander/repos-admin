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

@Module({
  imports: [
    MongooseModule.forRoot(configuration.DATABASE, { autoIndex: true }),
    MongooseModule.forFeature([
      { name: Folder.name, schema: FolderSchema },
      { name: Repo.name, schema: RepoSchema },
    ]),
  ],
  controllers: [FolderController, RepoController],
  providers: [FolderRepository, FolderService, RepoService, RepoRepository],
})
export class AppModule { }
