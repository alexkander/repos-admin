import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RepoDocument = HydratedDocument<Repo>;

@Schema()
export class Repo {
  @Prop() directory: string;
  @Prop() group: string;
  @Prop() localName: string;
  @Prop() valid: boolean;
  @Prop() remotes?: number;
  @Prop() branches?: number;
}

export const RepoSchema = SchemaFactory.createForClass(Repo);
