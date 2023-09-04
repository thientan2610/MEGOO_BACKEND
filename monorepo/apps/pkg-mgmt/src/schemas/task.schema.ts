import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { State, TimeUnit, WeekDays } from '@nyp19vp-be/shared';
import mongoose, { HydratedDocument } from 'mongoose';
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete';

export type TaskDocument = HydratedDocument<Task> & SoftDeleteDocument;

class Recurrence {
  @Prop({ type: Number, min: 0, required: true })
  times: number;

  @Prop({ type: String, enum: TimeUnit, required: true })
  unit: string;

  @Prop({ type: [{ type: String }], enum: WeekDays, required: false })
  repeatOn?: string[];

  @Prop({ type: mongoose.Schema.Types.Mixed, required: false })
  ends: mongoose.Schema.Types.Mixed;
}

@Schema({ timestamps: true })
export class Task {
  @Prop({ type: String, required: true })
  summary: string;

  @Prop({ type: String, required: false })
  description: string;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Boolean, required: true })
  isRepeated: boolean;

  @Prop({ required: false })
  recurrence?: Recurrence;

  @Prop({ required: false })
  members?: string[];

  @Prop({
    type: String,
    enum: State,
    required: true,
    default: State[1],
  })
  state: string;

  @Prop({ type: String, required: false })
  createdBy: string;

  @Prop({ type: String, required: false })
  updatedBy: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
TaskSchema.plugin(MongooseDelete, {
  overrideMethods: true,
  deletedAt: true,
});
