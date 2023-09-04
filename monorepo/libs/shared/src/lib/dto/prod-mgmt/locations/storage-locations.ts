import { Express } from 'express';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Multer } from 'multer';
import { Paginated, PaginateQuery } from 'nestjs-paginate';

import { ApiProperty } from '@nestjs/swagger';

import { BaseResDto } from '../../base.dto';
import { ProdMgmtGroupDto } from '../dto/group.dto';
import { StorageLocationDto } from '../dto/storage-location.dto';

export class CreateStorageLocationReqDto extends StorageLocationDto {
  @ApiProperty()
  groupId?: string;

  @ApiProperty({
    readOnly: true,
  })
  group?: ProdMgmtGroupDto;

  @ApiProperty({
    type: 'file',
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

export class CreateStorageLocationResDto extends BaseResDto {
  @ApiProperty({ type: StorageLocationDto })
  data?: StorageLocationDto;
}

export class GetStorageLocationByIdReqDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  groupId: string;
}

export class GetStorageLocationByIdResDto extends BaseResDto {
  @ApiProperty({ type: StorageLocationDto })
  data?: StorageLocationDto;
}

export class GetStorageLocationsPaginatedReqDto implements PaginateQuery {
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

export class GetStorageLocationsPaginatedResDto extends Paginated<StorageLocationDto> {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;
}

export class DeleteStorageLocationReqDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  groupId: string;
}

export class DeleteStorageLocationResDto extends BaseResDto {
  @ApiProperty({ type: StorageLocationDto })
  data?: StorageLocationDto;
}

export class RestoreStorageLocationReqDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  groupId: string;
}

export class RestoreStorageLocationResDto extends BaseResDto {
  @ApiProperty({ type: StorageLocationDto })
  data?: StorageLocationDto;
}

export class UpdateStorageLocationReqDto extends StorageLocationDto {
  @ApiProperty({
    readOnly: true,
  })
  groupId: string;

  @ApiProperty({
    readOnly: true,
  })
  id: string;

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

export class UpdateStorageLocationResDto extends BaseResDto {
  @ApiProperty({
    type: StorageLocationDto,
    description: 'Updated storage location (new)',
  })
  data?: StorageLocationDto;
}
