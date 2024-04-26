import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveRemoteRequestPayload {
  @IsString()
  @IsNotEmpty()
  directory: string;

  @IsString()
  @IsNotEmpty()
  remoteName: string;
}
