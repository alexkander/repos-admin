import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BranchDocument = HydratedDocument<Branch>;

@Schema()
export class Branch {
  @Prop() folderKey: string;
  @Prop() directory: string;
  @Prop() shortName: string;
  @Prop() largeName: string;
  @Prop() isRemote: boolean;
  @Prop() remote?: string;
  @Prop() commit: string;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);