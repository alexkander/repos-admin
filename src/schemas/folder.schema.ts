import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FolderDocument = HydratedDocument<Folder>;

@Schema()
export class Folder {
  @Prop() folderKey: string;
  @Prop() forderPath: string;
}

export const FolderSchema = SchemaFactory.createForClass(Folder);
