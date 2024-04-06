import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import { glob } from 'glob';
import { FilterQuery, Types } from 'mongoose';
import { RepoConstants } from '../constants/repo.constants';
import { RemoteHelper } from '../helpers/remote.helper';
import { FolderRepository } from '../repositories/folder.repository';
import { RemoteRepository } from '../repositories/remote.repository';
import { RepoRepository } from '../repositories/repo.repository';
import { Folder } from '../schemas/folder.schema';
import { Remote } from '../schemas/remote.schema';
import { Repo } from '../schemas/repo.schema';
import {
  FetchLogStatusType,
  RemoteFetchStatus,
  RemoteFilterQuery,
} from '../types/remotes.type';
import { ReposComparisonParams } from '../types/repos.types';
import { SortQueryData, WithBDId } from '../types/utils.types';
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

  count() {
    return this.repoRepository.count();
  }

  searchRepos(query: FilterQuery<Repo>, sort: SortQueryData<Repo>) {
    return this.repoRepository.findAll(query, sort);
  }

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

  async refresh(id: Types.ObjectId) {
    const repo = await this.repoRepository.findById(id);
    const folder = await this.folderRepository.findOneByKey(repo.folderKey);
    const gitRemotes = await this.getRemotesFromGitRepo({
      folder,
      directory: repo.directory,
    });
    const bdRemotes = await this.remoteRepository.findByRepo(repo);
    const upsertPromises = gitRemotes.map((gitRemote) => {
      const remoteData = RemoteHelper.gitRepoToBdRepo({
        gitRemote,
        folderKey: folder.folderKey,
        directory: repo.directory,
      });
      const bdRemote = bdRemotes.find((r) => r.name === remoteData.name);
      if (!bdRemote) {
        return this.remoteRepository.create(remoteData);
      }
      return this.remoteRepository.updateById(bdRemote._id, remoteData);
    });
    const results = await Promise.all(upsertPromises);
    return results;
  }

  async getRemotesFromGitRepo({
    folder,
    directory,
  }: {
    folder: Folder;
    directory: string;
  }) {
    const gitDirectory = routes.join(folder.folderPath, directory);
    const repo = new GitRepo(gitDirectory);
    const remotesData = await repo.getRemotes();
    const remotes = remotesData.map((item) => {
      return {
        folderKey: folder.folderKey,
        directory,
        ...item,
      };
    });
    return remotes;
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

  async gitFetch(type: string) {
    const getFolder = this.folderRepository.buildCache();
    const remotes = await this.remoteRepository.all();
    const fetchResults = [];
    const remotesFilter = remotes.filter((r) => this.remoteFilter(type, r));

    this.logger.doLog(`remotes to fetch ${remotesFilter.length}`);

    for (let idxRemote = 0; idxRemote < remotesFilter.length; idxRemote++) {
      const remote = remotesFilter[idxRemote];
      this.logger.doLog(
        `- remote ${idxRemote + 1} of ${remotesFilter.length} (${remote.name}): ${remote.url}`,
      );
      const { folderPath } = await getFolder(remote.folderKey);
      const fetchResult = await this.fetchRemotesFromRepo(folderPath, remote);
      fetchResults.push(fetchResult);
    }

    const failed = fetchResults.filter((i) => i.fetchStatus === 'error').length;

    this.logger.doLog(`remotes fetched. fails ${failed}`);
    return { failed, fetchResults };
  }

  remoteFilter(type: string, remote: WithBDId & Remote) {
    if (type === 'all') {
      return true;
    } else if (type === 'fetchStatusError') {
      return remote.fetchStatus === 'error';
    } else if (type === 'notFetched') {
      return !remote.fetchStatus;
    } else if (typeof type === 'string') {
      return type === remote._id.toHexString();
    }
    return true;
  }

  async fetchRemotesFromRepo(folderPath: string, remote: Remote) {
    const gitDirectory = routes.join(folderPath, remote.directory);
    const gitRepo = new GitRepo(gitDirectory);
    const filter: RemoteFilterQuery = {
      folderKey: remote.folderKey,
      directory: remote.directory,
      name: remote.name,
    };
    const result = await gitRepo
      .fetchAll(remote.name)
      .then((response) => ({
        status: FetchLogStatusType.SUCCESS,
        result: response,
      }))
      .catch((error) => ({ status: FetchLogStatusType.ERROR, result: error }));
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
