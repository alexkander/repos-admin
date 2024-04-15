import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BranchDocument = HydratedDocument<Branch>;

@Schema()
export class Branch {
  @Prop() directory: string;
  @Prop() shortName: string;
  @Prop() largeName: string;
  @Prop() remote?: string;
  @Prop() commit: string;
  @Prop() remoteSynched?: boolean;
  @Prop() localSynched?: boolean;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);
