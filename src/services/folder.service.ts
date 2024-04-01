import { Injectable } from '@nestjs/common';
import { configuration } from '../configuration/configuration';
import { FolderRepository } from '../repositories/folder.repository';
import { routes } from '../utils/routes';

@Injectable()
export class FolderService {
  constructor(private readonly folderRepository: FolderRepository) { }

  list() {
    return this.folderRepository.find();
  }

  listEnvFolder() {
    return configuration.FOLDERS.map((folder) => {
      const [folderKey, ...folderPath] = folder.trim().split(':');
      return {
        folderKey: folderKey?.trim(),
        folderPath: routes.resolve(folderPath.join(':').trim()),
        folder,
      };
    }).filter((i) => {
      if (!i.folderKey || !i.folderKey) {
        console.warn(`invalid folder: ${i.folder}`);
        return false;
      }
      return true;
    });
  }

  async saveEnvFolders() {
    await this.folderRepository.deleteMany();
    const localRepos = await this.listEnvFolder();
    const createPromises = localRepos.map((repo) => {
      return this.folderRepository.create(repo);
    });
    const records = Promise.all(createPromises);
    return records;
  }
}
