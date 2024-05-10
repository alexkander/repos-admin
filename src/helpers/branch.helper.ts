import { Branch } from 'src/schemas/branch.schema';
import { GitBranchType } from '../types/gitRepo.types';

export class BranchHelper {
  constructor() { }

  static gitBranchToBranch({
    gitBranch,
    directory,
  }: {
    gitBranch: GitBranchType;
    directory: string;
  }): Branch {
    return {
      directory,
      ...gitBranch,
    };
  }
}
