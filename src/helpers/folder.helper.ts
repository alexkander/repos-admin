import { FolderCreatePayload } from 'src/dtos/folder.dto';
import { Folder } from 'src/schemas/folder.schema';

export class FolderHelper {
  constructor() { }

  static folderCreatePayloadToFolder(payload: FolderCreatePayload): Folder {
    return payload;
  }
}
