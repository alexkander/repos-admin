import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RepoDocument = HydratedDocument<Repo>;

@Schema()
export class Repo {
  @Prop() _id: Types.ObjectId;
  @Prop() folderKey: string;
  @Prop() directory: string;
  @Prop() group: string;
  @Prop() localName: string;
  @Prop() valid: boolean;
  @Prop() remotes: number;
}

export const RepoSchema = SchemaFactory.createForClass(Repo);
