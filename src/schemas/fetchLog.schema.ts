import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { FetchLogStatusType } from '../types/fetchLog.type';

export type FetchLogDocument = HydratedDocument<FetchLog>;

@Schema()
export class FetchLog {
  @Prop() _id: Types.ObjectId;
  @Prop() folderKey: string;
  @Prop() directory: string;
  @Prop() remote: string;
  @Prop() status: FetchLogStatusType;
  @Prop(raw({})) result: Record<string, any>;
}

export const FetchLogSchema = SchemaFactory.createForClass(FetchLog);
