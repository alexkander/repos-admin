import { Body, Controller, Post } from '@nestjs/common';
import { BranchService } from 'src/services/branch.service';
import { CheckoutRequestPayload } from './dtos/checkout-request-body';
import { PullRequestPayload } from './dtos/pull-request-body';
import { PushRequestPayload } from './dtos/push-request-body';
import { RemoveBranchRequestPayload } from './dtos/remove-branch-request-body';

@Controller('branch')
export class BranchController {
  constructor(private readonly branchService: BranchService) { }

  @Post('/checkout')
  checkout(@Body() body: CheckoutRequestPayload) {
    return this.branchService.checkout(body);
  }

  @Post('/push')
  push(@Body() body: PushRequestPayload) {
    return this.branchService.push(body);
  }

  @Post('/pull')
  pull(@Body() body: PullRequestPayload) {
    return this.branchService.pull(body);
  }

  @Post('/remove')
  remove(@Body() body: RemoveBranchRequestPayload) {
    return this.branchService.remove(body);
  }
}
