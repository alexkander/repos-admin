import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveBranchRequestPayload {
  @IsString()
  @IsNotEmpty()
  readonly directory: string;

  @IsString()
  @IsNotEmpty()
  readonly branchLargeName: string;
}
