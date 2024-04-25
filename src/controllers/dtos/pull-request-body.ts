import { IsNotEmpty, IsString } from 'class-validator';

export class PullRequestPayload {
  @IsString()
  @IsNotEmpty()
  readonly directory: string;

  @IsString()
  @IsNotEmpty()
  readonly branchLargeName: string;

  @IsString()
  @IsNotEmpty()
  readonly remoteName: string;
}
