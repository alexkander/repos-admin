import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GroupDocument = HydratedDocument<Group>;

@Schema()
export class Group {
  @Prop() _id: Types.ObjectId;
  @Prop() host: string;
  @Prop() group: string;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
