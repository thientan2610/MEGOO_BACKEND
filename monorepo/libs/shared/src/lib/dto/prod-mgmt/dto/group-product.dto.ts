import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ProdMgmtItemDto } from './item.dto';
import { TimestampEmbeddedDto } from './timestamp.embedded.dto';

export class GroupProductDto {
  @ApiProperty({ required: false, readOnly: true })
  id?: string;

  @ApiProperty()
  name?: string;

  @ApiPropertyOptional()
  image?: string;

  @ApiPropertyOptional()
  barcode?: string;

  @ApiPropertyOptional()
  price?: number;

  @ApiPropertyOptional()
  region?: string;

  @ApiPropertyOptional()
  brand?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ type: TimestampEmbeddedDto, readOnly: true })
  timestamp?: TimestampEmbeddedDto;

  items?: ProdMgmtItemDto[];
}
