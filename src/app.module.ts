import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { configuration } from './configuration/configuration';
import { RepoController } from './controllers/repo.controller';
import { RepoRepository } from './repositories/repo.repository';
import { Repo, RepoSchema } from './schemas/repo.schema';
import { RepoService } from './services/repo.service';

@Module({
  imports: [
    MongooseModule.forRoot(configuration.DATABASE, { autoIndex: true }),
    MongooseModule.forFeature([{ name: Repo.name, schema: RepoSchema }]),
  ],
  controllers: [RepoController],
  providers: [RepoService, RepoRepository],
})
export class AppModule {}
