import { IsNotEmpty, IsString } from 'class-validator';

export class FolderCreatePayload {
  @IsString()
  @IsNotEmpty()
  folderKey: string;

  @IsString()
  @IsNotEmpty()
  folderPath: string;
}
