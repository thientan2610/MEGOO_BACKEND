import { ApiProperty } from '@nestjs/swagger';

import { GroupProductDto } from './group-product.dto';
import { PurchaseLocationDto } from './purchase-location.dto';
import { StorageLocationDto } from './storage-location.dto';
import { TimestampEmbeddedDto } from './timestamp.embedded.dto';

export class ProdMgmtItemDto {
  @ApiProperty({ required: false, readOnly: true })
  id?: string;

  @ApiProperty({ type: GroupProductDto, required: false, readOnly: true })
  groupProduct?: GroupProductDto;

  @ApiProperty({
    type: PurchaseLocationDto,
    required: false,
    readOnly: true,
  })
  purchaseLocation?: PurchaseLocationDto;

  @ApiProperty({
    type: StorageLocationDto,
    required: false,
    readOnly: true,
  })
  storageLocation?: StorageLocationDto;

  @ApiProperty({ required: false })
  addedBy?: string;

  @ApiProperty({ required: false })
  bestBefore?: Date;

  @ApiProperty({ required: false })
  quantity?: number;

  @ApiProperty({ required: false })
  unit?: string;

  @ApiProperty({ required: false })
  image?: string;

  @ApiProperty({ type: TimestampEmbeddedDto, required: false, readOnly: true })
  timestamp?: TimestampEmbeddedDto;
}
