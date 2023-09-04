import {
  ApiProperty,
  PickType,
  IntersectionType,
  OmitType,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsArray,
  IsAscii,
  IsEmail,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import { BaseResDto, IdDto } from '../base.dto';
import { ObjectId } from 'mongodb';
import { Items, UserInfo } from '../users/users.dto';
import { PackageDto } from './package.dto';
import { GetGrDto_Todos } from './todos.dto';
import { GetGrDto_Bill } from './bill.dto';
import { GetGrDto_Task } from './task.dto';
import { GetGrDto_Fund } from './funding.dto';

export enum PkgStatus {
  'Not Activated',
  'Active',
  'Expired',
}

class MemberDto {
  @ApiProperty({
    type: String,
    nullable: true,
    required: true,
  })
  @Transform((v: TransformFnParams) => new ObjectId(v.value))
  user: string;

  @ApiProperty({
    type: String,
    enum: ['User', 'Super User'],
    example: 'User',
    nullable: true,
    required: true,
    default: 'User',
  })
  @IsEnum(['User', 'Super User'])
  @IsOptional()
  role?: string;

  @ApiProperty({
    type: String,
    description: 'User ID',
    nullable: true,
    required: false,
  })
  @Transform((v: TransformFnParams) => new ObjectId(v.value))
  @IsOptional()
  addedBy?: string;
}

class PkgDto extends PickType(Items, ['duration', 'noOfMember']) {
  @ApiProperty({
    required: true,
    description: 'Package ID',
    example: '646095c6a962a5a8f865aa77',
  })
  _id: string;
}

export class GrPkgDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => PkgDto)
  package: PkgDto;

  @ApiProperty({ type: Date })
  @IsISO8601()
  startDate: Date;

  @ApiProperty({ type: Date })
  @IsISO8601()
  endDate: Date;

  @ApiProperty({
    type: String,
    enum: PkgStatus,
    required: true,
  })
  @IsEnum(PkgStatus)
  status: string;
}

export class GroupDto extends IdDto {
  @ApiProperty({
    type: String,
    minLength: 3,
    maxLength: 30,
    uniqueItems: true,
    nullable: false,
    required: true,
    example: 'Group No.1',
    description: 'Name of group, must be an ascii string',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Avatar of group. Only supported upload file',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  avatar?: string;

  @ApiProperty({ description: 'Channel url of Sendbird' })
  channel: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => GrPkgDto)
  @IsArray()
  packages: GrPkgDto[];

  @ApiProperty()
  @ValidateNested()
  @Type(() => MemberDto)
  @IsArray()
  members: MemberDto[];
}

class CreateGrReqDto_Pkg extends PkgDto {
  @ApiProperty({
    description: 'Quantity of package',
    type: Number,
    minimum: 1,
    example: 1,
  })
  quantity: number;
}

export class CreateGrReqDto {
  @ApiProperty({
    example: [
      {
        duration: 12,
        noOfMember: 4,
        quantity: 2,
        _id: '646095c6a962a5a8f865aa77',
      },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => CreateGrReqDto_Pkg)
  packages: CreateGrReqDto_Pkg[];

  @ApiProperty({
    example: {
      user: '6425a5f3f1757ad283e82b23',
    },
  })
  @ValidateNested()
  @Type(() => MemberDto)
  member: MemberDto;
}

export class UpdateChannelReqDto extends IntersectionType(
  IdDto,
  PickType(GroupDto, ['channel']),
) {}

export class UpdateGrReqDto extends IntersectionType(
  IdDto,
  PickType(GroupDto, ['name']),
) {}

export class ActivateGrPkgReqDto extends IntersectionType(
  IdDto,
  PickType(GrPkgDto, ['package']),
) {
  user: string;
}

export class AddGrMbReqDto extends IntersectionType(
  IdDto,
  PickType(MemberDto, ['user', 'addedBy']),
) {}

export class RmGrMbReqDto extends IntersectionType(
  IdDto,
  PickType(MemberDto, ['user']),
) {}

export class UpdateGrPkgReqDto extends ActivateGrPkgReqDto {}

export class CheckGrSUReqDto extends IdDto {
  user: string;
}

export class IsGrUReqDto extends IdDto {
  users: IdDto[];
}

export class PkgGrInvReqDto {
  @ApiProperty({
    description: 'Group ID, mongo object id',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @Transform((v: TransformFnParams) => new ObjectId(v.value))
  grId: string;

  @ApiProperty({
    description: 'Emails of users to invite',
    type: String,
    isArray: true,
    required: true,
  })
  @IsNotEmpty()
  @IsEmail(undefined, { each: true })
  emails: string[];

  // NOT show to swagger, retrieve by access token
  addedBy?: string;

  @ApiProperty({
    name: 'feUrl',
    type: String,
    required: true,
    description:
      'The front end url point to FE that concat with token (e.g. `feUrl?token=xxx`)',
    example: 'http://localhost:8080/pgk-mgmt/gr/join',
  })
  feUrl?: string;
}

export class PkgGrInvResDto extends BaseResDto {
  @ApiProperty({
    description: 'Emails of users failed to invite',
    type: String,
    isArray: true,
    required: false,
  })
  data?: {
    emailsFailed: string[];
  };
}

export class ProjectionParams extends IdDto {
  @ApiPropertyOptional({
    description:
      'Use only allowed properties separated by semicolon; To return all fields in the matching documents, omit this parameter',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  projection?: string;

  proj?: Record<string, unknown>;
}

export class PaginationParams extends OmitType(ProjectionParams, ['_id']) {
  @Transform((v: TransformFnParams) => new ObjectId(v.value))
  user?: string;

  @ApiPropertyOptional({
    description: 'Role of user',
    enum: ['User', 'Super User'],
    required: false,
  })
  @IsEnum(['User', 'Super User'])
  @IsOptional()
  role?: string;

  @Type(() => Number)
  @Min(0)
  @ApiPropertyOptional({
    example: 0,
    description: 'The range based pagination',
    required: false,
  })
  @IsOptional()
  page?: number = 0;

  @Type(() => Number)
  @Min(0)
  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    example: 5,
    description: 'Limits the number of records or documents',
    required: false,
  })
  limit?: number = 5;

  @ApiPropertyOptional({
    example: '-createdAt',
    description:
      'Use only allowed properties separated by semicolon; default is ascending createdAt; prefix name with hyphen/minus sign to get descending order',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  sort?: string;

  sorter?: Record<string, 1 | -1>;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  next?: number;
  prev?: number;
}

export class GetGrDto_Pkg extends OmitType(GrPkgDto, ['package']) {
  package: PackageDto;
}

export class GetGrDto_Memb extends PickType(MemberDto, ['role']) {
  user: UserInfo;
  addedBy: UserInfo;
}

export class GetGrDto extends IdDto {
  name?: string;
  avatar?: string;
  channel?: string;
  billing?: GetGrDto_Bill[];
  funding?: GetGrDto_Fund[];
  todos?: GetGrDto_Todos[];
  task?: GetGrDto_Task[];
  packages?: GetGrDto_Pkg[];
  members?: GetGrDto_Memb[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  deleted?: boolean;
}

export class GetGrResDto extends BaseResDto {
  @ApiProperty()
  @ValidateNested()
  group: GetGrDto;
}

export class GetGrsResDto extends BaseResDto {
  @ApiProperty()
  @ValidateNested({ each: true })
  groups: GetGrDto[];

  pagination: Pagination;
}

export class GetGrByExReqDto extends IdDto {
  @IsEnum(['todos', 'billing', 'task'])
  extension: string;
}
