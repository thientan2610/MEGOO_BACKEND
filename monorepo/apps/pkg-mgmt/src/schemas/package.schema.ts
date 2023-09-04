import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete';

export type PackageDocument = HydratedDocument<Package> & SoftDeleteDocument;

class Extensions {
  @Prop({ type: Boolean, default: true })
  taskReminder: boolean;

  @Prop({ type: Boolean, default: true })
  todoList: boolean;

  @Prop({ type: Boolean, default: true })
  billing: boolean;

  @Prop({ type: Boolean, default: true })
  rateCalculator: boolean;
}

@Schema({ timestamps: true })
export class Package {
  @Prop({ type: String, unique: true, required: true })
  name: string;

  @Prop({ type: Number, minimum: 30, required: true })
  duration: number;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: Number, required: true, minimum: 1 })
  noOfMember: number;

  @Prop({ type: Boolean, required: false, default: false })
  editableDuration: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  editableNoOfMember: boolean;

  @Prop({
    required: true,
    default: {
      taskReminder: true,
      todoList: true,
      billing: true,
      rateCalculator: true,
    },
  })
  extensions: Extensions;

  @Prop({ type: String, maxlength: 1000, required: false })
  description: string;

  @Prop({ required: false })
  coefficient: number;

  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: String })
  updatedBy: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const PackageSchema = SchemaFactory.createForClass(Package);
PackageSchema.plugin(MongooseDelete, {
  overrideMethods: true,
  deletedAt: true,
});
