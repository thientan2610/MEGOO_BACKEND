import { Prop } from '@nestjs/mongoose';
export class Method {
  @Prop({
    type: String,
    enum: ['Digital Wallet', 'Bank Transfer', 'Play Store'],
  })
  type: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, unique: true, required: true })
  trans_id: string;

  @Prop({ type: Object, required: false })
  embed_data: string;
}
