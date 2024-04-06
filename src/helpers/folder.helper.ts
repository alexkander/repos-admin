import { Folder } from 'src/schemas/folder.schema';
import { FolderCreatePayload } from 'src/types/folder.types';

export class FolderHelper {
  constructor() { }

  static folderCreatePayloadToFolder(payload: FolderCreatePayload): Folder {
    return payload;
  }
}
