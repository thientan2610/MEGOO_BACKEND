import { Paginated, PaginateQuery } from 'nestjs-paginate';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseResDto } from '../../base.dto';
import { ProdMgmtItemDto } from '../dto/item.dto';

/** CREATE ITEM */

export class CreateItemReqDto extends ProdMgmtItemDto {
  @ApiProperty({ required: true })
  groupProductId: string;

  @ApiProperty({ required: true })
  storageLocationId: string;

  @ApiProperty({ required: true })
  purchaseLocationId: string;
}

export class CreateItemResDto extends BaseResDto {
  @ApiProperty({
    type: ProdMgmtItemDto,
  })
  data?: ProdMgmtItemDto;
}

/** GET ITEM BY ID */

export class GetItemByIdReqDto {
  @ApiProperty()
  groupId: string;

  @ApiProperty()
  id: string;
}

export class GetItemByIdResDto extends BaseResDto {
  @ApiProperty({
    type: ProdMgmtItemDto,
  })
  data?: ProdMgmtItemDto;
}

/** GET ITEMS **PAGINATED** */

export class GetItemsPaginatedReqDto implements PaginateQuery {
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

  @ApiPropertyOptional()
  groupProductId?: string;
}

export class GetItemsPaginatedResDto extends Paginated<ProdMgmtItemDto> {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;
}

/** DELETE ITEM */

export class DeleteItemReqDto {
  @ApiProperty()
  groupId: string;

  @ApiProperty()
  id: string;
}

export class DeleteItemResDto extends BaseResDto {
  @ApiProperty({
    type: ProdMgmtItemDto,
  })
  data?: ProdMgmtItemDto;
}

/** UPDATE ITEM */

/**
 * The `UpdateItemReqDto.id` will be filled by the `@Param('id')` decorator in the controller.
 */
export class UpdateItemReqDto extends ProdMgmtItemDto {
  @ApiProperty({
    readOnly: true,
  })
  groupId?: string;
}

export class UpdateItemResDto extends BaseResDto {
  @ApiProperty({
    type: ProdMgmtItemDto,
  })
  data?: ProdMgmtItemDto;
}

/** RESTORE ITEM */

/**
 * The `RestoreItemReqDto.id` will be filled by the `@Param('id')` decorator in the controller.
 */
export class RestoreItemReqDto {
  @ApiProperty()
  groupId: string;

  @ApiProperty()
  id: string;
}

export class RestoreItemResDto extends BaseResDto {
  @ApiProperty({
    type: ProdMgmtItemDto,
  })
  data?: ProdMgmtItemDto;
}
