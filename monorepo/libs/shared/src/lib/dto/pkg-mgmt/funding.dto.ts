import { ApiProperty, IntersectionType, OmitType } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ObjectId } from 'mongodb';
import { BillStatus } from './bill.dto';
import { BaseResDto, IdDto } from '../base.dto';
import { UserInfo } from '../users/users.dto';

export enum FundingStatus {
  TODO,
  ONGOING,
  DONE,
}

export class FundingDto {
  @ApiProperty({ type: String, nullable: true, required: true })
  summary: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({ type: Date, example: new Date() })
  @IsISO8601()
  startDate: Date;

  @ApiProperty({
    type: Number,
    required: true,
    minimum: 1,
    maximum: 12,
    example: 1,
  })
  @Min(1)
  @Max(12)
  times: number;

  @ApiProperty({ required: false, example: new Date() })
  @IsOptional()
  ends?: Date | number;

  @ApiProperty({ required: true })
  members: string[];

  @ApiProperty({
    type: Number,
    required: true,
    minimum: 1000,
    example: 1000000,
  })
  total: number;

  @Type(() => HistFundDto)
  @ValidateNested({ each: true })
  @IsOptional()
  history?: HistFundDto[];

  @IsOptional()
  @IsEnum(FundingStatus)
  status?: string;

  createdBy?: string;

  createdAt?: Date;

  updatedAt?: Date;
}

class HistFundDto {
  contributors: ContributorDto[];

  createdAt?: Date;

  updatedAt?: Date;
}

export class ContributorDto {
  @ApiProperty({
    type: String,
    nullable: true,
    required: true,
    example: '648a7dff13638f64bbf9c156',
  })
  @Transform((v: TransformFnParams) => new ObjectId(v.value))
  user: string;

  @ApiProperty({ type: Number, required: true, minimum: 1000, example: 10000 })
  amount: number;

  @IsOptional()
  @IsEnum(BillStatus)
  status?: string;
}
export class CreateFundingReqDto extends IntersectionType(
  IdDto,
  OmitType(FundingDto, ['history', 'status', 'createdAt', 'updatedAt']),
) {
  createdBy: string;
}
export class GetGrDto_Fund extends IntersectionType(
  IdDto,
  OmitType(FundingDto, ['members']),
) {
  members: UserInfo[];
}

export class GetFundingResDto extends BaseResDto {
  funding: GetGrDto_Fund;
}

export class SendReqDto {
  @ApiProperty({
    type: String,
    nullable: true,
    required: true,
    example: '648a7dff13638f64bbf9c156',
  })
  @Transform((v: TransformFnParams) => new ObjectId(v.value))
  group_id: string;

  @ApiProperty({
    type: String,
    nullable: true,
    required: true,
    example: '648a7dff13638f64bbf9c156',
  })
  @Transform((v: TransformFnParams) => new ObjectId(v.value))
  fund_id: string;

  @Transform((v: TransformFnParams) => new ObjectId(v.value))
  from_user: string;

  @ApiProperty({
    type: String,
    nullable: true,
    required: true,
    example: '648a7dff13638f64bbf9c156',
  })
  @Transform((v: TransformFnParams) => new ObjectId(v.value))
  to_user: string;
}

export class UpdateFundingSttReqDto extends IdDto {
  @Transform((v: TransformFnParams) => new ObjectId(v.value))
  user: string;

  @Transform((v: TransformFnParams) => new ObjectId(v.value))
  group: string;

  @ApiProperty({ enum: BillStatus })
  @IsEnum(BillStatus)
  status: string;

  updatedBy?: string;
}
