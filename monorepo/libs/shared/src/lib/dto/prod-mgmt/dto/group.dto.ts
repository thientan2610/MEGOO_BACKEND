import { Entity } from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';

import { GroupProductDto } from './group-product.dto';
import { PurchaseLocationDto } from './purchase-location.dto';
import { StorageLocationDto } from './storage-location.dto';
import { TimestampEmbeddedDto } from './timestamp.embedded.dto';

@Entity({
  name: 'groups',
})
export class ProdMgmtGroupDto {
  @ApiProperty({ required: false, readOnly: true })
  id?: string;

  groupProducts?: GroupProductDto[];

  purchaseLocations?: PurchaseLocationDto[];

  storageLocations?: StorageLocationDto[];

  @ApiProperty({ required: false, readOnly: true, type: TimestampEmbeddedDto })
  timestamp?: TimestampEmbeddedDto;
}
