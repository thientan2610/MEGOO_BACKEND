import { ApiProperty } from '@nestjs/swagger';

import { ProdMgmtItemDto } from './item.dto';
import { TimestampEmbeddedDto } from './timestamp.embedded.dto';

export class StorageLocationDto {
  @ApiProperty({ required: false, readOnly: true })
  id?: string;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  addedBy?: string;

  @ApiProperty({ required: false })
  image?: string;

  @ApiProperty({ required: false })
  description?: string;

  // @ApiProperty({ required: false, type: [ItemDto], name: '__items__' })
  items?: ProdMgmtItemDto[];

  // @ApiProperty({ required: false })
  timestamp?: TimestampEmbeddedDto;
}
