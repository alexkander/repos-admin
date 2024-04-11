import { Injectable } from '@nestjs/common';
import { RemoteHelper } from '../helpers/remote.helper';
import { RemoteRepository } from '../repositories/remote.repository';
import { Remote } from '../schemas/remote.schema';
import { RemoteFilterQuery } from '../types/remotes.type';
import { GitRepo } from '../utils/gitRepo.class';
import { LoggerService } from './logger.service';

@Injectable()
export class GitService {
  constructor(
    private readonly logger: LoggerService,
    private readonly remoteRepository: RemoteRepository,
  ) { }

  async fetchRepoRemote(gitRepo: GitRepo, remote: Remote) {
    this.logger.doLog(`  fetch remote: ${remote.name}: ${remote.url}`);
    const filter: RemoteFilterQuery = {
      directory: remote.directory,
      name: remote.name,
    };
    const status = await RemoteHelper.fetchRemoteFromGitRepo(
      gitRepo,
      remote.name,
    );
    const update = await this.remoteRepository.updateFetchInfo(filter, status);
    return { ...filter, ...status, update };
  }
}
