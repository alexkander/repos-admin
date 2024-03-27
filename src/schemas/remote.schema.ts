import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { RemoteUrlType } from '../types/remotes.type';

export type RemoteDocument = HydratedDocument<Remote>;

@Schema()
export class Remote {
  @Prop() folderKey: string;
  @Prop() directory: string;
  @Prop() name: string;
  @Prop() url: string;
  @Prop() rare: boolean;
  @Prop(raw({})) refs: Record<string, any>;
  @Prop() urlType?: RemoteUrlType;
  @Prop() sshUrl?: string;
  @Prop() targetHost?: string | null;
  @Prop() targetUser?: string;
  @Prop() targetGroup?: string;
  @Prop() targetName?: string;
}

export const RemoteSchema = SchemaFactory.createForClass(Remote);
