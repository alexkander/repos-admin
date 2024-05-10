import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TagDocument = HydratedDocument<Tag>;

@Schema()
export class Tag {
  @Prop() directory: string;
  @Prop() commit: string;
  @Prop() shortName: string;
  @Prop() largeName: string;
  @Prop() remoteName?: string;
  @Prop() remoteSynched?: boolean;
}

export const TagSchema = SchemaFactory.createForClass(Tag);
