import { Express } from 'express';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Multer } from 'multer';
import { Paginated, PaginateQuery } from 'nestjs-paginate';

import { ApiProperty } from '@nestjs/swagger';

import { BaseResDto } from '../../base.dto';
import { NewGroupProductDto } from '../dto/new-group-product.dto';

/** CREATE NEW GROUP PRODUCT */

export class CreateNewGroupProductReqDto extends NewGroupProductDto {
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
      'The image of the new group product. Accepts base64 string or URL.',
    type: 'string',
  })
  image?: string;
}

export class CreateNewGroupProductResDto extends BaseResDto {
  @ApiProperty({
    type: NewGroupProductDto,
    description: 'The new new group product.',
  })
  data?: NewGroupProductDto;
}

/** GET NEW GROUP PRODUCT BY ID */

export class GetNewGroupProductByIdReqDto {
  @ApiProperty()
  groupId: string;

  @ApiProperty()
  id: string;
}

export class GetNewGroupProductByIdResDto extends BaseResDto {
  @ApiProperty({
    type: NewGroupProductDto,
    description: 'The new new group product.',
  })
  data?: NewGroupProductDto;
}

/** GET NEW GROUP PRODUCTS **PAGINATED** */

export class GetNewGroupProductsPaginatedReqDto implements PaginateQuery {
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

export class GetNewGroupProductsPaginatedResDto extends Paginated<NewGroupProductDto> {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;
}

/**  DELETE NEW GROUP PRODUCT */

/**
 * The `DeleteNewGroupProductReqDto.groupId` will be filled by the `groupId` from the request `Params`.
 * The `DeleteNewGroupProductReqDto.id` will be filled by the `id` from the request `Params`.
 */
export class DeleteNewGroupProductReqDto {
  @ApiProperty({
    readOnly: true,
  })
  groupId: string;

  @ApiProperty({
    readOnly: true,
  })
  id: string;
}

export class DeleteNewGroupProductResDto extends BaseResDto {}

/** UPDATE NEW GROUP PRODUCT */

/**
 * The `UpdateNewGroupProductReqDto.groupId` will be filled by the `groupId` from the request `Params`.
 * The `UpdateNewGroupProductReqDto.id` will be filled by the `id` from the request `Params`.
 */
export class UpdateNewGroupProductReqDto extends NewGroupProductDto {
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
      'The image of the new group product. Accepts base64 string or URL.',
    type: 'string',
  })
  image?: string;
}

export class UpdateNewGroupProductResDto extends BaseResDto {
  @ApiProperty({
    type: NewGroupProductDto,
    description: 'The updated new group product (new values).',
  })
  data?: NewGroupProductDto;
}

/** RESTORE NEW GROUP PRODUCT */

/**
 * The `RestoreNewGroupProductReqDto.groupId` will be filled by the `groupId` from the request `Params`.
 * The `RestoreNewGroupProductReqDto.id` will be filled by the `id` from the request `Params`.
 */

export class RestoreNewGroupProductReqDto {
  @ApiProperty({
    readOnly: true,
  })
  groupId: string;

  @ApiProperty({
    readOnly: true,
  })
  id: string;
}

export class RestoreNewGroupProductResDto extends BaseResDto {
  @ApiProperty({
    type: NewGroupProductDto,
    description: 'The restored new group product (new values).',
  })
  data?: NewGroupProductDto;
}
