import { Prop } from '@nestjs/mongoose';

export class Item {
  @Prop({ type: String, unique: true, required: true })
  package: string;

  @Prop({ type: Number, min: 1, required: false })
  duration: number;

  @Prop({ type: Number, min: 2, required: false })
  noOfMember: number;

  @Prop({ type: Number, min: 1, required: true })
  quantity: number;
}
