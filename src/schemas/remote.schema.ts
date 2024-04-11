import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { FetchLogStatusType, RemoteUrlType } from '../types/remotes.type';

export type RemoteDocument = HydratedDocument<Remote>;

@Schema()
export class Remote {
  @Prop() directory: string;
  @Prop() name: string;
  @Prop() url: string;
  @Prop() rare: boolean;
  @Prop(raw({})) refs: Record<string, any>;
  @Prop() branches?: number;
  @Prop() urlType?: RemoteUrlType;
  @Prop() targetHost?: string | null;
  @Prop() targetGroup?: string;
  @Prop() targetName?: string;
  @Prop() fetchStatus?: FetchLogStatusType;
  @Prop(raw({})) fetchResult?: Record<string, any>;
}

export const RemoteSchema = SchemaFactory.createForClass(Remote);
