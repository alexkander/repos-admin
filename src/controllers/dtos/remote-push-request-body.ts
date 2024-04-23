import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class RemotePushRequestPayload {
  @IsString()
  @IsNotEmpty()
  readonly localBranchId: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  readonly remoteId: Types.ObjectId;
}
