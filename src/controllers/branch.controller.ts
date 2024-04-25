import { Body, Controller, Patch } from '@nestjs/common';
import { BranchService } from 'src/services/branch.service';
import { CheckoutRequestPayload } from './dtos/checkout-request-body';
import { PullRequestPayload } from './dtos/pull-request-body';
import { PushRequestPayload } from './dtos/push-request-body';

@Controller('branch')
export class BranchController {
  constructor(private readonly branchService: BranchService) { }

  @Patch('/checkout')
  checkout(@Body() body: CheckoutRequestPayload) {
    return this.branchService.checkout(body);
  }

  @Patch('/push')
  push(@Body() body: PushRequestPayload) {
    return this.branchService.push(body);
  }

  @Patch('/pull')
  pull(@Body() body: PullRequestPayload) {
    return this.branchService.pull(body);
  }
}
