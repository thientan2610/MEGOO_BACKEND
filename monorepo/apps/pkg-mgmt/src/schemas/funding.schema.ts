import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BillStatus, FundingStatus } from '@nyp19vp-be/shared';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete';

export type FundingDocument = HydratedDocument<Funding> & SoftDeleteDocument;
export type FundHistDocument = HydratedDocument<FundHist>;

class Contributor {
  @Prop({ type: String, required: true })
  user: string;

  @Prop({ type: Number, required: true, min: 10000 })
  amount: number;

  @Prop({
    type: String,
    required: true,
    enum: BillStatus,
  })
  status: string;
}

@Schema({ timestamps: true })
export class FundHist {
  @Prop()
  contributors: Contributor[];

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

@Schema({ timestamps: true })
export class Funding {
  @Prop({ type: String, required: true })
  summary: string;

  @Prop({ type: String, required: false })
  description: string;

  @Prop({ type: Date, required: false })
  startDate: Date;

  @Prop({ type: Number, min: 0, required: true })
  times: number;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: false })
  ends: mongoose.Schema.Types.Mixed;

  @Prop({ required: true })
  members: string[];

  @Prop({ type: Number, min: 1000, required: true })
  total: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'FundHist' }] })
  history: FundHist[];

  @Prop({
    type: String,
    required: true,
    enum: FundingStatus,
  })
  status: string;

  @Prop({ type: String, required: false })
  createdBy: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const FundHistSchema = SchemaFactory.createForClass(FundHist);
export const FundingSchema = SchemaFactory.createForClass(Funding);
FundingSchema.plugin(MongooseDelete, {
  overrideMethods: true,
  deletedAt: true,
});
