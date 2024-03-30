import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { glob } from 'glob';
import { FetchLogStatusType } from 'src/types/fetchLog.type';
import { RepoConstants } from '../constants/repo.constants';
import { FetchLogRepository } from '../repositories/fetchLog.repository';
import { FolderRepository } from '../repositories/folder.repository';
import { RemoteRepository } from '../repositories/remote.repository';
import { RepoRepository } from '../repositories/repo.repository';
import { FetchLog } from '../schemas/fetchLog.schema';
import { Folder } from '../schemas/folder.schema';
import { routes } from '../utils/routes';
import { GitRepoService } from './gitRepo.service';
import { LoggerService } from './logger.service';

@Injectable()
export class RepoService {
  constructor(
    private readonly logger: LoggerService,
    private readonly repoRepository: RepoRepository,
    private readonly remoteRepository: RemoteRepository,
    private readonly folderRepository: FolderRepository,
    private readonly gitRepoService: GitRepoService,
    private readonly fetchLogRepoService: FetchLogRepository,
  ) { }

  list() {
    return this.repoRepository.find();
  }

  async saveLocalRepos() {
    await this.repoRepository.deleteMany();
    const localRepos = await this.listLocalRepos();
    const createPromises = localRepos.map((repo) => {
      return this.repoRepository.create(repo);
    });
    const records = Promise.all(createPromises);
    return records;
  }

  async listLocalRepos() {
    const directories = await this.folderRepository.find();
    const allFilesPromises = directories.map((folder) => {
      return this.getReposInDirectory(folder.forderPath, folder);
    });
    const allFiles = (await Promise.all(allFilesPromises)).flatMap((f) => f);

    return allFiles;
  }

  async getReposInDirectory(directory: string, folder: Folder) {
    const allSubDirectories = await this.getSubDirectories(directory);
    const subDirectories = allSubDirectories.filter((d) => {
      return !RepoConstants.ignoreDirectories.find((regex) => d.match(regex));
    });

    const reposPromises = subDirectories.map(async (subDirectory) => {
      const itemDirectory = routes.resolve(directory, subDirectory);
      const gitDirectory = routes.resolve(itemDirectory, '.git');
      if (fs.existsSync(gitDirectory)) {
        const directory = routes.relative(folder.forderPath, itemDirectory);
        const group = routes.dirname(directory);
        const localName = routes.basename(directory);
        const repo = this.gitRepoService.getRepoFrom(
          folder.forderPath,
          directory,
        );
        const valid = await repo.isRepo();
        const data = {
          folderKey: folder.folderKey,
          directory,
          group,
          localName,
          valid,
          remotes: 0,
        };
        return [data];
      } else {
        return this.getReposInDirectory(itemDirectory, folder);
      }
    });

    const repos = (await Promise.all(reposPromises)).flatMap((f) => f);

    return repos;
  }

  async getSubDirectories(directory: string) {
    const subDirectories = await glob(RepoConstants.pattern, {
      cwd: directory,
    });
    return subDirectories.map((subDir) => {
      return subDir.split('\\').join('/');
    });
  }

  async countRemotes() {
    const repos = await this.repoRepository.getValidRepos();
    const updatePromises = repos.map(async (repo) => {
      const remotes = await this.remoteRepository.listByDirectory(
        repo.directory,
      );
      repo.remotes = remotes.length;
      return this.repoRepository.update(repo._id, repo);
    });
    const result = await Promise.all(updatePromises);
    return result;
  }

  async gitFetchAllRemotes() {
    const cache: Record<string, string> = {};
    const getFolder = async (folderKey: string) => {
      if (cache[folderKey]) return cache[folderKey];
      const folder = await this.folderRepository.findOneByKey(folderKey);
      cache[folder.folderKey] = folder.forderPath;
      return cache[folderKey] || '';
    };
    const repos = await this.repoRepository.getValidRepos();
    this.logger.doLog(`fetching ${repos.length} repos`);

    const results: any[] = [];

    let idxRepo = 0;
    for (const repo of repos) {
      idxRepo += 1;
      const folderPath = await getFolder(repo.folderKey);
      const gitRepo = this.gitRepoService.getRepoFrom(
        folderPath,
        repo.directory,
      );
      const fetchResults: FetchLog[] = [];
      const remotes = await gitRepo.getRemotes();

      this.logger.doLog(
        `- fetch repo ${idxRepo} of ${repos.length}. remotes: ${remotes.length} ${repo.directory}`,
      );

      let idxRemote = 0;
      for (const remote of remotes) {
        idxRemote += 1;
        this.logger.doLog(
          `  remote ${remote.name}. ${idxRemote} of ${remotes.length}`,
        );
        const { status, result } = await gitRepo
          .fetchAll(remote.name)
          .then((response) => {
            return { status: FetchLogStatusType.SUCCESS, result: response };
          })
          .catch((error) => {
            return { status: FetchLogStatusType.ERROR, result: error };
          });
        const log = await this.fetchLogRepoService.create({
          folderKey: repo.folderKey,
          directory: repo.directory,
          remote: remote.name,
          status,
          result,
        });
        fetchResults.push(log);
      }

      const failed = fetchResults.filter((i) => i.status === 'error').length;
      this.logger.doLog(
        `- repo remotes failed: ${failed} in ${repo.directory}`,
      );
      results.push({ repo: repo.directory, failed, fetchResults });
    }
    return results.filter((i) => i.failed);
  }
}
