import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class RemoteCheckoutRequestPayload {
  @IsString()
  @IsNotEmpty()
  readonly remoteBranchId: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  readonly branchName: string;
}
