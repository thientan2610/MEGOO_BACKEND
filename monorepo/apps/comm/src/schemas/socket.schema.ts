import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SocketDocument = HydratedDocument<Socket>;

@Schema({ timestamps: true })
export class Socket {
  @Prop({ type: String, unique: true, required: true })
  user_id: string;

  @Prop({ type: String, required: true })
  client_id: string;

  @Prop({ type: Boolean, required: true })
  status: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const SocketSchema = SchemaFactory.createForClass(Socket);
