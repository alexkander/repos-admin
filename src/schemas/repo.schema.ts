import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RepoDocument = HydratedDocument<Repo>;

@Schema()
export class Repo {
  @Prop() folderKey: string;
  @Prop() directory: string;
  @Prop() group: string;
  @Prop() localName: string;
  @Prop() valid: boolean;
}

export const RepoSchema = SchemaFactory.createForClass(Repo);
