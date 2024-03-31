import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FolderDocument = HydratedDocument<Folder>;

@Schema()
export class Folder {
  @Prop() _id: Types.ObjectId;
  @Prop() folderKey: string;
  @Prop() forderPath: string;
}

export const FolderSchema = SchemaFactory.createForClass(Folder);
