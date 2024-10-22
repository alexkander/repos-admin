import { BadRequestException, Injectable } from '@nestjs/common';
import { CheckoutRequestPayload } from 'src/controllers/dtos/checkout-request-body';
import { PullRequestPayload } from 'src/controllers/dtos/pull-request-body';
import { PushRequestPayload } from 'src/controllers/dtos/push-request-body';
import { RemoveBranchRequestPayload } from 'src/controllers/dtos/remove-branch-request-body';
import { BranchRepository } from 'src/repositories/branch.repository';
import { Branch } from 'src/schemas/branch.schema';
import { RepoHelper } from '../helpers/repo.helper';
import { GitService } from './git.service';

@Injectable()
export class BranchService {
  constructor(
    private readonly branchRepository: BranchRepository,
    private readonly gitService: GitService,
  ) { }

  async checkout({
    directory,
    branchLargeName,
    newBranchName,
  }: CheckoutRequestPayload) {
    const branchToCheckout = await this.branchRepository.findByRepoAndLargeName(
      { directory, largeName: branchLargeName },
    );

    const gitRepo = RepoHelper.getGitRepo(branchToCheckout.directory);
    if (branchToCheckout.largeName === newBranchName) {
      await gitRepo.checkout(newBranchName);
    } else {
      await gitRepo.checkout(newBranchName, branchToCheckout.commit);
    }

    const newBranch: Branch = {
      directory: branchToCheckout.directory,
      shortName: newBranchName,
      largeName: newBranchName,
      commit: branchToCheckout.commit,
      backedUp: branchToCheckout.shortName === newBranchName,
    };
    await this.branchRepository.upsertByDirectoryAndLargeName(newBranch);
    await this.gitService.updateRepoCountsByDirectory({
      directory: branchToCheckout.directory,
    });
  }

  async push({ directory, remoteName, branchLargeName }: PushRequestPayload) {
    const branchToPush = await this.branchRepository.findByRepoAndLargeName({
      directory,
      largeName: branchLargeName,
    });
    if (branchToPush.remoteName) {
      throw new BadRequestException('branch should be a local branch');
    }
    const gitRepo = RepoHelper.getGitRepo(branchToPush.directory);
    const result = await gitRepo.push(remoteName, branchToPush.shortName);

    const newBranch: Branch = {
      directory: branchToPush.directory,
      shortName: branchToPush.shortName,
      remoteName,
      commit: branchToPush.commit,
      remoteSynched: true,
      largeName: gitRepo.getRemoteBranchName(
        remoteName,
        branchToPush.shortName,
      ),
      backedUp: true,
    };

    await this.branchRepository.upsertByDirectoryAndLargeName(newBranch);

    await this.gitService.updateRepoCountsByDirectory({
      directory: branchToPush.directory,
    });

    await this.gitService.updateRemoteCountsByDirectoryAndName({
      directory: branchToPush.directory,
      name: remoteName,
    });

    return result;
  }

  async pull({ directory, remoteName, branchLargeName }: PullRequestPayload) {
    const branchToPull = await this.branchRepository.findByRepoAndLargeName({
      directory,
      largeName: branchLargeName,
    });
    if (branchToPull.remoteName) {
      throw new BadRequestException('branch should be a local branch');
    }
    const gitRepo = RepoHelper.getGitRepo(branchToPull.directory);
    await gitRepo.checkout(branchToPull.shortName);
    const result = await gitRepo.pull(remoteName, branchToPull.shortName);
    await gitRepo.checkout('-');

    const branches = await gitRepo.getBranches();
    const branch = branches.find(
      (b) => !b.remoteName && b.shortName === branchToPull.shortName,
    );

    const updateBranch: Branch = {
      ...branchToPull,
      ...branch,
    };

    await this.branchRepository.upsertByDirectoryAndLargeName(updateBranch);

    await this.gitService.updateRepoCountsByDirectory({
      directory: branchToPull.directory,
    });

    await this.gitService.updateRemoteCountsByDirectoryAndName({
      directory: branchToPull.directory,
      name: remoteName,
    });

    return result;
  }

  async remove({ directory, branchLargeName }: RemoveBranchRequestPayload) {
    const branchToRemove = await this.branchRepository.findByRepoAndLargeName({
      directory,
      largeName: branchLargeName,
    });
    if (branchToRemove.remoteName) {
      throw new BadRequestException('branch should be a local branch');
    }

    const gitRepo = RepoHelper.getGitRepo(branchToRemove.directory);
    const result = await gitRepo.deleteLocalBranch(branchToRemove.shortName);

    await this.branchRepository.deleteById(branchToRemove._id);

    await this.gitService.updateRepoCountsByDirectory({
      directory: branchToRemove.directory,
    });

    return result;
  }
}
