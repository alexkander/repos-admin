import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { glob } from 'glob';
import { RepoConstants } from '../constants/repo.constants';
import { FolderRepository } from '../repositories/folder.repository';
import { RemoteRepository } from '../repositories/remote.repository';
import { RepoRepository } from '../repositories/repo.repository';
import { Folder } from '../schemas/folder.schema';
import { Repo } from '../schemas/repo.schema';
import { GitRemoteType } from '../types/gitRepo.types';
import {
  FetchLogStatusType,
  RemoteFetchStatus,
  RemoteFilterQuery,
} from '../types/remotes.type';
import { ReposComparisonParams } from '../types/repos.types';
import { GitRepo } from '../utils/gitRepo.class';
import { routes } from '../utils/routes';
import { LoggerService } from './logger.service';

@Injectable()
export class RepoService {
  constructor(
    private readonly logger: LoggerService,
    private readonly repoRepository: RepoRepository,
    private readonly remoteRepository: RemoteRepository,
    private readonly folderRepository: FolderRepository,
  ) { }

  async saveLocalRepos() {
    await this.repoRepository.truncate();
    const localRepos = await this.listLocalRepos();
    const createPromises = localRepos.map((repo) => {
      return this.repoRepository.create(repo);
    });
    const records = Promise.all(createPromises);
    return records;
  }

  async listLocalRepos() {
    const directories = await this.folderRepository.all();
    const allFilesPromises = directories.map((folder) => {
      return this.getReposInDirectory(folder.folderPath, folder);
    });
    const allFiles = (await Promise.all(allFilesPromises)).flatMap((f) => f);

    return allFiles;
  }

  async getReposInDirectory(directory: string, folder: Folder) {
    const allSubDirectories = await this.getSubDirectories(directory);
    const subDirectories = allSubDirectories.filter((d) => {
      return !RepoConstants.ignoreDirectories.find((regex) =>
        d.match(new RegExp(regex)),
      );
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
      const gitRepoDirectory = routes.join(folder.folderPath, repoDirectory);
      const repo = new GitRepo(gitRepoDirectory);
      const valid = await repo.isRepo();
      const remotes = valid ? await repo.getRemotes() : [];
      const branches = valid ? await repo.getBranches() : [];
      const data = {
        folderKey: folder.folderKey,
        directory: repoDirectory,
        group,
        localName,
        valid,
        remotes: remotes.length,
        branches: branches.length,
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

  async fetchAllRepos(ignoreFetched: boolean) {
    const getFolder = this.folderRepository.buildCache();
    const repos = await this.repoRepository.findValidRepos();
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
    const gitDirectory = routes.join(folderPath, repo.directory);
    const gitRepo = new GitRepo(gitDirectory);
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

  async compareRepos(params: ReposComparisonParams) {
    const { folderKeyFrom, folderKeyTo, directoryFrom, directoryTo } = params;

    const [folderFrom, folderTo] = await this.validateFoldersByKeys([
      folderKeyFrom,
      folderKeyTo,
    ]);

    const [gitRepoFrom, gitRepoTo] = await this.validateGitRepos([
      routes.join(folderFrom.folderPath, directoryFrom),
      routes.join(folderTo.folderPath, directoryTo),
    ]);

    const [branchesFrom, branchesTo] = await Promise.all([
      gitRepoFrom.getBranches(),
      gitRepoTo.getBranches(),
    ]);

    const branchesFromSummaryPromises = branchesFrom.map(async (branch) => {
      const sameNameBranchesToPromises = branchesTo
        .filter((b) => b.shortName === branch.shortName)
        .map(async (b) => {
          const isDescendent = await gitRepoTo.isDescendent(
            b.commit,
            branch.commit,
          );
          return { ...b, isDescendent };
        });

      const sameNameBranchesTo = await Promise.all(sameNameBranchesToPromises);

      const noDescendants = !sameNameBranchesTo.find((b) => b.isDescendent);

      return {
        ...branch,
        noDescendants,
        sameNameBranchesTo,
      };
    });

    const branchesFromSummary = await Promise.all(branchesFromSummaryPromises);
    const noDescendantsBranchesFrom = branchesFromSummary.filter(
      (b) => b.noDescendants,
    );

    return noDescendantsBranchesFrom;
  }

  validateFoldersByKeys(foldersKeys: string[]) {
    const promises = foldersKeys.map(async (folderKey) => {
      const folder = await this.folderRepository.findOneByKey(folderKey);
      if (!folder) {
        throw new NotFoundException(`folder ${folderKey} not found`);
      }
      return folder;
    });
    return Promise.all(promises);
  }

  validateGitRepos(directories: string[]) {
    const promises = directories.map(async (directory) => {
      const gitRepo = new GitRepo(directory);
      const isRepo = await gitRepo.isRepo();
      if (!isRepo) {
        throw new BadRequestException(
          `directory ${directory} is not a git repo`,
        );
      }
      return gitRepo;
    });
    return Promise.all(promises);
  }
}
