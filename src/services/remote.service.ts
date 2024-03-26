import { Injectable } from '@nestjs/common';
import { FolderRepository } from '../repositories/folder.repository';
import { RemoteRepository } from '../repositories/remote.repository';
import { RepoRepository } from '../repositories/repo.repository';
import { GitRepoService } from './gitRepo.service';

@Injectable()
export class RemoteService {
  constructor(
    private readonly remoteRepository: RemoteRepository,
    private readonly repoRepository: RepoRepository,
    private readonly folderRepository: FolderRepository,
    private readonly gitRepoService: GitRepoService,
  ) { }

  list() {
    return this.remoteRepository.find();
  }

  async listLocalRemotes() {
    const folders = await this.folderRepository.find();
    const remotesPromises = folders.map(async (folder) => {
      const repositories = await this.repoRepository.getValidReposByFolderKey(
        folder.folderKey,
      );
      const remotesPromises = repositories.map(async (repository) => {
        const repo = this.gitRepoService.getRepoFrom(
          folder.forderPath,
          repository.directory,
        );
        const remotesData = await repo.getRemotes();
        const remotes = remotesData.map((item) => {
          return {
            folderKey: folder.folderKey,
            directory: repository.directory,
            ...item,
          };
        });
        return remotes;
      });

      const remotes = (await Promise.all(remotesPromises)).flatMap((r) => r);
      return remotes;
    });

    const remotes = (await Promise.all(remotesPromises)).flatMap((r) => r);
    return remotes;
  }

  async saveLocalRemotes() {
    await this.remoteRepository.deleteMany();
    const localRemotes = await this.listLocalRemotes();
    const createPromises = localRemotes.map((remote) => {
      return this.remoteRepository.create(remote);
    });
    const records = Promise.all(createPromises);
    return records;
  }
}
