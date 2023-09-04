import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BillStatus } from '@nyp19vp-be/shared';
import { HydratedDocument } from 'mongoose';
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete';

export type BillDocument = HydratedDocument<Bill> & SoftDeleteDocument;

class Borrower {
  @Prop({ type: String, required: true })
  borrower: string;

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
export class Bill {
  @Prop({ type: String, required: true })
  summary: string;

  @Prop({ type: Date, required: false })
  date: Date;

  @Prop({ type: String, required: true })
  lender: string;

  @Prop()
  borrowers: Borrower[];

  @Prop({ type: String, required: false })
  description: string;

  @Prop({ type: String, required: false })
  createdBy: string;

  @Prop({ type: String, required: false })
  updatedBy: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const BillSchema = SchemaFactory.createForClass(Bill);
BillSchema.plugin(MongooseDelete, {
  overrideMethods: true,
  deletedAt: true,
});
