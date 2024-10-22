import { IsNotEmpty, IsString } from 'class-validator';

export class CheckoutRequestPayload {
  @IsString()
  @IsNotEmpty()
  readonly directory: string;

  @IsString()
  @IsNotEmpty()
  readonly branchLargeName: string;

  @IsString()
  @IsNotEmpty()
  readonly newBranchName: string;
}
