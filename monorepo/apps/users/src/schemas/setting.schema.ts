import { Prop } from '@nestjs/mongoose';

export class UserSetting {
  @Prop({ type: Boolean, default: true })
  stockNoti: boolean;

  @Prop({ type: Boolean, default: true })
  callNoti: boolean;

  @Prop({ type: Boolean, default: true })
  msgNoti: boolean;

  @Prop({ type: Boolean, default: true })
  newsNoti: boolean;
}
