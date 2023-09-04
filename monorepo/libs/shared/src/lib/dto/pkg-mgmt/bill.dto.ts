import {
  ApiProperty,
  IntersectionType,
  OmitType,
  PickType,
} from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { ObjectId } from 'mongodb';
import { BaseResDto, IdDto } from '../base.dto';
import { UserInfo } from '../users/users.dto';

export enum BillStatus {
  PENDING,
  APPROVED,
  CANCELED,
}

class BorrowerDto {
  @ApiProperty({
    type: String,
    nullable: true,
    required: true,
    example: '648a7dff13638f64bbf9c156',
  })
  @Transform((v: TransformFnParams) => new ObjectId(v.value))
  borrower: string;

  @ApiProperty({ type: Number, required: true, minimum: 1000, example: 10000 })
  amount: number;

  @IsOptional()
  @IsEnum(BillStatus)
  status?: string;
}

export class BillingDto {
  @ApiProperty({ type: String, nullable: true, required: true })
  summary: string;

  @ApiProperty({ type: Date, required: false })
  @IsOptional()
  date?: Date;

  @ApiProperty({
    example: [{ borrower: '648a7dff13638f64bbf9c156', amount: 10000 }],
  })
  @Type(() => BorrowerDto)
  @ValidateNested({ each: true })
  borrowers: BorrowerDto[];

  @ApiProperty({ type: String, nullable: true, required: true })
  @Transform((v: TransformFnParams) => new ObjectId(v.value))
  lender: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  description?: string;

  createdBy: string;

  updatedBy: string;

  createdAt?: Date;

  updatedAt?: Date;
}

export class CreateBillReqDto extends IntersectionType(
  IdDto,
  OmitType(BillingDto, ['updatedBy']),
) {}

export class GetBorrowerDto extends OmitType(BorrowerDto, ['borrower']) {
  borrower: UserInfo;
}

export class GetGrDto_Bill extends IntersectionType(
  IdDto,
  OmitType(BillingDto, ['lender', 'borrowers', 'createdBy', 'updatedBy']),
) {
  lender: UserInfo;
  total: number;
  @IsEnum(BillStatus)
  status: string;
  borrowers: UserInfo[];
  createdBy: UserInfo;
  updatedBy: UserInfo;
}

export class GetBillResDto extends BaseResDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => GetGrDto_Bill)
  billing: GetGrDto_Bill;
}

export class UpdateBillReqDto extends IntersectionType(
  IdDto,
  OmitType(BillingDto, ['createdBy']),
) {}

export class BorrowSttReqDto extends PickType(BorrowerDto, ['borrower']) {
  @ApiProperty({ enum: BillStatus })
  @IsEnum(BillStatus)
  status: string;
}

export class UpdateBillSttReqDto extends IntersectionType(
  IdDto,
  PickType(BillingDto, ['updatedBy']),
) {
  @ApiProperty({
    example: [{ borrower: '648a7dff13638f64bbf9c156', status: BillStatus[0] }],
  })
  @Type(() => BorrowSttReqDto)
  @ValidateNested({ each: true })
  borrowers: BorrowSttReqDto[];
}

export class SendRequestReqDto extends IdDto {
  @ApiProperty({ type: String, nullable: true, required: true })
  @Transform((v: TransformFnParams) => new ObjectId(v.value))
  to_user: string;

  from_user?: string;
}
