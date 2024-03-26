import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RepoDocument = HydratedDocument<Repo>;

@Schema()
export class Repo {
  @Prop() folderKey: string;
  @Prop() directory: string;
  @Prop() group: string;
  @Prop() localName: string;
  @Prop() valid: boolean;
  @Prop(raw({})) error: Record<string, any>;
}

export const RepoSchema = SchemaFactory.createForClass(Repo);
