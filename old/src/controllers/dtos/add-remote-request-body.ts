import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class AddRemoteRequestPayload {
  @IsString()
  @IsNotEmpty()
  directory: string;

  @IsString()
  @IsNotEmpty()
  remoteName: string;

  @IsString()
  @IsNotEmpty()
  remoteUrl: string;

  @IsBoolean()
  @IsNotEmpty()
  doFetch: boolean;
}
