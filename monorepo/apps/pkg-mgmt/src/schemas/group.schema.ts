import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete';
import { Bill } from './billing.schema';
import { TodoList } from './todos.schema';
import { Task } from './task.schema';
import { PkgStatus } from '@nyp19vp-be/shared';
import { Funding } from './funding.schema';

export type GroupDocument = HydratedDocument<Group> & SoftDeleteDocument;

class Pkg {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: Number, required: true, minimum: 1 })
  duration: number;

  @Prop({ type: Number, required: true, minimum: 2 })
  noOfMember: number;
}

class GrPkg {
  @Prop({ required: true })
  package: Pkg;

  @Prop({ type: Date, required: false })
  startDate: Date;

  @Prop({ type: Date, required: false })
  endDate: Date;

  @Prop({
    type: String,
    enum: PkgStatus,
    required: true,
  })
  status: string;
}

class Member {
  @Prop({ type: String, required: true })
  user: string;

  @Prop({
    type: String,
    required: true,
    enum: ['User', 'Super User'],
    default: 'User',
  })
  role: string;

  @Prop({ type: String })
  addedBy: string;

  @Prop({ type: Date })
  addedAt: Date;
}

@Schema({ timestamps: true })
export class Group {
  @Prop({ type: String, unique: true, required: true })
  name: string;

  @Prop({
    required: false,
    type: String,
    default:
      'https://res.cloudinary.com/dzpxhrxsq/image/upload/v1648138020/cld-sample.jpg',
  })
  avatar: string;

  @Prop({
    type: String,
    trim: true,
    index: {
      unique: true,
      partialFilterExpression: { phone: { $type: 'string' } },
    },
  })
  channel: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Billing' }] })
  billing: Bill[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Funding' }] })
  funding: Funding[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'TodoList' }] })
  todos: TodoList[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Task' }] })
  task: Task[];

  @Prop({ required: true, minlength: 1 })
  packages: GrPkg[];

  @Prop({ required: true, minlength: 1 })
  members: Member[];

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
GroupSchema.plugin(MongooseDelete, { overrideMethods: true, deletedAt: true });
