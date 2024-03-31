import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BranchDocument = HydratedDocument<Branch>;

@Schema()
export class Branch {
  @Prop() _id: Types.ObjectId;
  @Prop() folderKey: string;
  @Prop() directory: string;
  @Prop() shortName: string;
  @Prop() largeName: string;
  @Prop() isRemote: boolean;
  @Prop() remote?: string;
  @Prop() commit: string;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);
