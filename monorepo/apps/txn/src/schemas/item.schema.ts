import { Prop } from '@nestjs/mongoose';

export class Item {
  @Prop({ type: String, unique: true, required: true })
  id: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Number, required: true, min: 50 })
  price: number;

  @Prop({ type: Number, min: 1, required: false })
  duration: number;

  @Prop({ type: Number, min: 2, required: false })
  noOfMember: number;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;
}
