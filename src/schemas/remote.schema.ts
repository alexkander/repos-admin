import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RemoteDocument = HydratedDocument<Remote>;

@Schema()
export class Remote {
  @Prop() folderKey: string;
  @Prop() directory: string;
  @Prop() name: string;
  @Prop() url: string;
  @Prop() rare: boolean;
  @Prop(raw({})) refs: Record<string, any>;
}

export const RemoteSchema = SchemaFactory.createForClass(Remote);
