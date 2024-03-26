import { Controller, Get, Post } from '@nestjs/common';
import { BranchService } from '../services/branch.service';

@Controller('branch')
export class BranchController {
  constructor(private readonly branchService: BranchService) { }

  @Get('/')
  list() {
    return this.branchService.list();
  }

  @Get('/listBranches')
  listBranches() {
    return this.branchService.listBranches();
  }

  @Post('/saveBranches')
  saveBranches() {
    return this.branchService.saveBranches();
  }
}
