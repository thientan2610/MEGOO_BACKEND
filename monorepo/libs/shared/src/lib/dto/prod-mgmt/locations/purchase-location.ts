import { Paginated, PaginateQuery } from 'nestjs-paginate';

import { ApiProperty } from '@nestjs/swagger';

import { BaseResDto } from '../../base.dto';
import { ProdMgmtGroupDto } from '../dto/group.dto';
import { PurchaseLocationDto } from '../dto/purchase-location.dto';

export class CreatePurchaseLocationReqDto extends PurchaseLocationDto {
  @ApiProperty()
  groupId?: string;

  @ApiProperty({
    readOnly: true,
  })
  group?: ProdMgmtGroupDto;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    name: 'file',
  })
  file?: Express.Multer.File;

  @ApiProperty({
    description:
      'The image of the group product. Accepts base64 string or URL.',
    type: 'string',
  })
  image?: string;
}

export class CreatePurchaseLocationResDto extends BaseResDto {
  @ApiProperty({ readOnly: true, type: PurchaseLocationDto })
  data?: PurchaseLocationDto;
}

export class GetPurchaseLocationByIdReqDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  groupId: string;
}

export class GetPurchaseLocationByIdResDto extends BaseResDto {
  @ApiProperty({ readOnly: true, type: PurchaseLocationDto })
  data?: PurchaseLocationDto;
}

export class GetPurchaseLocationsPaginatedReqDto implements PaginateQuery {
  page?: number;
  limit?: number;
  sortBy?: [string, string][];
  searchBy?: string[];
  search?: string;
  filter?: { [column: string]: string | string[] };
  select?: string[];
  path: string;

  @ApiProperty()
  groupId: string;
}

export class GetPurchaseLocationsPaginatedResDto extends Paginated<PurchaseLocationDto> {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;
}

export class DeletePurchaseLocationReqDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  groupId: string;
}

export class DeletePurchaseLocationResDto extends BaseResDto {
  @ApiProperty({
    type: PurchaseLocationDto,
  })
  data?: PurchaseLocationDto;
}

export class RestorePurchaseLocationReqDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  groupId: string;
}

export class RestorePurchaseLocationResDto extends BaseResDto {
  @ApiProperty({
    type: PurchaseLocationDto,
  })
  data?: PurchaseLocationDto;
}

/**
 * The `UpdatePurchaseLocationReqDto.groupId` will be filled by the `groupId` param in the route.
 * The `UpdatePurchaseLocationReqDto.id` will be filled by the `id` param in the route.
 */
export class UpdatePurchaseLocationReqDto extends PurchaseLocationDto {
  @ApiProperty({
    readOnly: true,
  })
  groupId: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    name: 'file',
  })
  file?: Express.Multer.File;

  @ApiProperty({
    description:
      'The image of the group product. Accepts base64 string or URL.',
    type: 'string',
  })
  image?: string;
}

export class UpdatePurchaseLocationResDto extends BaseResDto {
  @ApiProperty({
    type: PurchaseLocationDto,
    description: 'The updated purchase location (new)',
  })
  data?: PurchaseLocationDto;
}
