import { Injectable } from '@nestjs/common';
import { BranchRepository } from '../repositories/branch.repository';
import { FolderRepository } from '../repositories/folder.repository';
import { RepoRepository } from '../repositories/repo.repository';
import { GitRepoService } from './gitRepo.service';

@Injectable()
export class BranchService {
  constructor(
    private readonly branchRepository: BranchRepository,
    private readonly repoRepository: RepoRepository,
    private readonly folderRepository: FolderRepository,
    private readonly gitRepoService: GitRepoService,
  ) { }

  list() {
    return this.branchRepository.find();
  }

  async listBranches() {
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
        const branchesData = await repo.getBranches();
        const branches = branchesData.map((item) => {
          return {
            folderKey: folder.folderKey,
            directory: repository.directory,
            ...item,
          };
        });
        return branches;
      });

      const remotes = (await Promise.all(remotesPromises)).flatMap((r) => r);
      return remotes;
    });

    const remotes = (await Promise.all(remotesPromises)).flatMap((r) => r);
    return remotes;
  }

  async saveBranches() {
    await this.branchRepository.deleteMany();
    const branches = await this.listBranches();
    const createPromises = branches.map((remote) => {
      return this.branchRepository.create(remote);
    });
    const records = Promise.all(createPromises);
    return records;
  }
}
