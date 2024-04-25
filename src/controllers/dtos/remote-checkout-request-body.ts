import { IsNotEmpty, IsString } from 'class-validator';

export class RemoteCheckoutRequestPayload {
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
