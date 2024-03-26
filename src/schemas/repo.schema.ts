import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RepoDocument = HydratedDocument<Repo>;

@Schema()
export class Repo {
  @Prop() valid: boolean;
  @Prop() baseDir: string;
  @Prop() dirname: string;
  @Prop() basename: string;
  @Prop(raw({})) error: Record<string, any>;
}

export const RepoSchema = SchemaFactory.createForClass(Repo);
