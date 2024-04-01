import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { glob } from 'glob';
import { RepoConstants } from 'src/constants/repo.constants';
import { Repo } from 'src/schemas/repo.schema';
import { GitRepo } from 'src/types/gitRepo.class';
import { GitRemoteType } from 'src/types/gitRepo.types';
import { FolderRepository } from '../repositories/folder.repository';
import { RemoteRepository } from '../repositories/remote.repository';
import { RepoRepository } from '../repositories/repo.repository';
import { Folder } from '../schemas/folder.schema';
import {
  FetchLogStatusType,
  RemoteFetchStatus,
  RemoteFilterQuery,
} from '../types/remotes.type';
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
      return this.getReposInDirectory(folder.folderPath, folder);
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
      if (!fs.existsSync(gitDirectory)) {
        return this.getReposInDirectory(itemDirectory, folder);
      }
      const repoDirectory = routes.relative(folder.folderPath, itemDirectory);
      const group = routes.dirname(repoDirectory);
      const localName = routes.basename(repoDirectory);
      const repo = this.gitRepoService.getRepoFrom(
        folder.folderPath,
        repoDirectory,
      );
      const valid = await repo.isRepo();
      const data = {
        folderKey: folder.folderKey,
        directory: repoDirectory,
        group,
        localName,
        valid,
        remotes: 0,
      };
      return [data];
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
      const remotes = await this.remoteRepository.findByDirectory(
        repo.directory,
      );
      repo.remotes = remotes.length;
      return this.repoRepository.update(repo._id, repo);
    });
    const result = await Promise.all(updatePromises);
    return result;
  }

  async fetchAllRepos(ignoreFetched: boolean) {
    const getFolder = this.folderRepository.buildCache();
    const repos = await this.repoRepository.getValidRepos();
    const results = [];

    this.logger.doLog(`fetching ${repos.length} repos`);

    for (let idxRepo = 0; idxRepo < repos.length; idxRepo++) {
      const repo = repos[idxRepo];
      idxRepo += 1;
      const result = await this.fetchAllRemotesFromRepo({
        ignoreFetched,
        idxRepo,
        repo,
        getFolder,
        reposLength: repos.length,
      });
      if (result.failed) {
        results.push(result);
      }
    }
    return results;
  }

  async fetchAllRemotesFromRepo(params: {
    ignoreFetched: boolean;
    repo: Repo;
    idxRepo: number;
    reposLength: number;
    getFolder: (key: string) => Promise<Folder>;
  }) {
    const { ignoreFetched, getFolder, repo, idxRepo, reposLength } = params;
    const { folderPath } = await getFolder(repo.folderKey);
    const gitRepo = this.gitRepoService.getRepoFrom(folderPath, repo.directory);
    const remotes = await gitRepo.getRemotes();

    this.logger.doLog(
      `- fetch repo ${idxRepo} of ${reposLength}. remotes: ${remotes.length} ${repo.directory}`,
    );

    const fetchRemotesPromises = remotes.map((remote, idxRemote) => {
      return this.fetchRemotesFromRepo({
        ignoreFetched,
        getFolder,
        gitRepo,
        idxRemote: idxRemote + 1,
        remote,
        repo,
        remoteLength: remotes.length,
      });
    });

    const fetchResults = await Promise.all(fetchRemotesPromises);

    const failed = fetchResults.filter((i) => i.fetchStatus === 'error').length;
    this.logger.doLog(`- repo remotes failed: ${failed} in ${repo.directory}`);
    return { repo: repo.directory, failed, fetchResults };
  }

  async fetchRemotesFromRepo(params: {
    ignoreFetched: boolean;
    repo: Repo;
    remote: GitRemoteType;
    idxRemote: number;
    remoteLength: number;
    gitRepo: GitRepo;
    getFolder: (key: string) => Promise<Folder>;
  }) {
    const { repo, remote, idxRemote, remoteLength, gitRepo } = params;
    const filter: RemoteFilterQuery = {
      folderKey: repo.folderKey,
      directory: repo.directory,
      name: remote.name,
    };
    if (params.ignoreFetched) {
      const bdRemote = await this.remoteRepository.findOneInRepoByName(filter);
      if (bdRemote?.fetchResult && bdRemote?.fetchStatus) {
        this.logger.doLog(
          `  remote ${idxRemote} of ${remoteLength} (${remote.name}) ignore.`,
        );
        const status: RemoteFetchStatus = {
          fetchStatus: bdRemote.fetchStatus,
          fetchResult: bdRemote.fetchResult,
        };
        return { ...filter, ...status };
      }
    }
    this.logger.doLog(
      `  remote ${idxRemote} of ${remoteLength} (${remote.name}) `,
    );
    const result = await gitRepo
      .fetchAll(remote.name)
      .then((response) => {
        return { status: FetchLogStatusType.SUCCESS, result: response };
      })
      .catch((error) => {
        return { status: FetchLogStatusType.ERROR, result: error };
      });
    const status: RemoteFetchStatus = {
      fetchStatus: result.status,
      fetchResult: result.result,
    };
    const update = await this.remoteRepository.updateFetchInfo(filter, status);
    return { ...filter, ...status, update };
  }
}
