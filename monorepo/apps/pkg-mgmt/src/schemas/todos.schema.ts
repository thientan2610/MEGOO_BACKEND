import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { State } from '@nyp19vp-be/shared';
import { HydratedDocument, Types } from 'mongoose';
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete';

export type TodoListDocument = HydratedDocument<TodoList> & SoftDeleteDocument;
export type TodoDocument = HydratedDocument<Todo>;

@Schema()
export class Todo {
  @Prop({ type: String, required: true })
  todo: string;

  @Prop({ type: String, required: false })
  assignee: string;

  @Prop({ type: String, required: false })
  description: string;

  @Prop({ type: Boolean, required: true, default: false })
  isCompleted: boolean;
}

@Schema({ timestamps: true })
export class TodoList {
  @Prop({ type: String, required: true })
  summary: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Todo' }] })
  todos: Todo[];

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

export const TodoSchema = SchemaFactory.createForClass(Todo);
export const TodoListSchema = SchemaFactory.createForClass(TodoList);
TodoListSchema.plugin(MongooseDelete, {
  overrideMethods: true,
  deletedAt: true,
});
