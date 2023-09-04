import { Express } from 'express';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Multer } from 'multer';
import { Paginated, PaginateQuery } from 'nestjs-paginate';

import { ApiProperty } from '@nestjs/swagger';

import { BaseResDto } from '../../base.dto';
import { GroupProductDto } from '../dto/group-product.dto';

/** CREATE GROUP PRODUCT */

export class CreateGroupProductReqDto extends GroupProductDto {
  @ApiProperty()
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

export class CreateGroupProductResDto extends BaseResDto {
  @ApiProperty({
    type: GroupProductDto,
    description: 'The group product.',
  })
  data?: GroupProductDto;
}

/** GET GROUP PRODUCT BY ID */

export class GetGroupProductByIdReqDto {
  @ApiProperty()
  groupId: string;

  @ApiProperty()
  id: string;
}

export class GetGroupProductByIdResDto extends BaseResDto {
  @ApiProperty({
    type: GroupProductDto,
    description: 'The group product.',
  })
  data?: GroupProductDto;
}

/** GET GROUP PRODUCTS **PAGINATED** */

export class GetGroupProductsPaginatedReqDto implements PaginateQuery {
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

export class GetGroupProductsPaginatedResDto extends Paginated<GroupProductDto> {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;
}

/**  DELETE GROUP PRODUCT */

/**
 * The `DeleteGroupProductReqDto.groupId` will be filled by the `groupId` from the request `Params`.
 * The `DeleteGroupProductReqDto.id` will be filled by the `id` from the request `Params`.
 */
export class DeleteGroupProductReqDto {
  @ApiProperty({
    readOnly: true,
  })
  groupId: string;

  @ApiProperty({
    readOnly: true,
  })
  id: string;
}

export class DeleteGroupProductResDto extends BaseResDto {}

/** UPDATE GROUP PRODUCT */

/**
 * The `UpdateGroupProductReqDto.groupId` will be filled by the `groupId` from the request `Params`.
 * The `UpdateGroupProductReqDto.id` will be filled by the `id` from the request `Params`.
 */
export class UpdateGroupProductReqDto extends GroupProductDto {
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

export class UpdateGroupProductResDto extends BaseResDto {
  @ApiProperty({
    type: GroupProductDto,
    description: 'The updated group product (new values).',
  })
  data?: GroupProductDto;
}

/** RESTORE GROUP PRODUCT */

/**
 * The `RestoreGroupProductReqDto.groupId` will be filled by the `groupId` from the request `Params`.
 * The `RestoreGroupProductReqDto.id` will be filled by the `id` from the request `Params`.
 */

export class RestoreGroupProductReqDto {
  @ApiProperty({
    readOnly: true,
  })
  groupId: string;

  @ApiProperty({
    readOnly: true,
  })
  id: string;
}

export class RestoreGroupProductResDto extends BaseResDto {
  @ApiProperty({
    type: GroupProductDto,
    description: 'The restored group product (new values).',
  })
  data?: GroupProductDto;
}
