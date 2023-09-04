import { ApiProperty } from '@nestjs/swagger';

import { TimestampEmbeddedDto } from './timestamp.embedded.dto';
import { GroupDto } from '../groups';
import { ProdMgmtGroupDto } from './group.dto';

export enum EInterval {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class NewGroupProductDto {
  @ApiProperty({ required: false, readOnly: true })
  id?: string;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  image?: string;

  @ApiProperty({ required: false })
  price?: number;

  @ApiProperty({ required: false })
  bestBefore?: Date;

  @ApiProperty({ required: false })
  lastNotification?: Date;

  @ApiProperty({ required: false })
  nextNotification?: Date;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  interval?: number;

  @ApiProperty({ required: false, enum: EInterval })
  intervalType?: EInterval;

  @ApiProperty({ type: TimestampEmbeddedDto, required: false, readOnly: true })
  timestamp?: TimestampEmbeddedDto;

  @ApiProperty({ required: false, readOnly: true, type: GroupDto })
  group: ProdMgmtGroupDto;
}
