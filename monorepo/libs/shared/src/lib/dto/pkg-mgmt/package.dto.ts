import {
  ApiProperty,
  IntersectionType,
  OmitType,
  PickType,
} from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsPositive,
  IsAscii,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { BaseResDto, IdDto } from '../base.dto';
import { Type } from 'class-transformer';

class ExtensionsDto {
  @ApiProperty({
    type: Boolean,
    default: true,
  })
  @IsBoolean()
  taskReminder: boolean;

  @ApiProperty({
    type: Boolean,
    default: true,
  })
  @IsBoolean()
  todoList: boolean;

  @ApiProperty({
    type: Boolean,
    default: true,
  })
  @IsBoolean()
  billing: boolean;

  @ApiProperty({
    type: Boolean,
    default: true,
  })
  @IsBoolean()
  rateCalculator: boolean;
}

export class PackageDto extends IdDto {
  @ApiProperty({
    type: String,
    minLength: 3,
    maxLength: 30,
    uniqueItems: true,
    nullable: false,
    required: true,
    example: 'Package No.1',
    description: 'Name of Package, must be an ascii string',
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: Number,
    minimum: 30,
    required: true,
    description: 'Duration of package; unit: date',
  })
  @IsInt()
  @IsPositive()
  duration: number;

  @ApiProperty({ required: true })
  @IsPositive()
  price: number;

  @ApiProperty({ required: true, minimum: 1 })
  @IsInt()
  @IsPositive()
  noOfMember: number;

  @ApiProperty({ required: false, default: false, example: false })
  editableDuration?: boolean;

  @ApiProperty({ required: false, default: false, example: false })
  editableNoOfMember?: boolean;

  @ApiProperty({ required: false })
  @ValidateNested()
  @Type(() => ExtensionsDto)
  extensions?: ExtensionsDto;

  @ApiProperty({
    type: String,
    minLength: 3,
    maxLength: 1000,
    nullable: true,
  })
  @IsString()
  description: string;

  @ApiProperty()
  coefficient: number;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  updatedBy: string;
}

export class CreatePkgReqDto extends OmitType(PackageDto, ['updatedBy']) {}

export class UpdatePkgReqDto extends IntersectionType(
  IdDto,
  OmitType(PackageDto, ['createdBy']),
) {}

export class GetPkgResDto extends BaseResDto {
  @ApiProperty()
  package: PackageDto;
}

export class FilterPkgReqDto extends PickType(PackageDto, [
  'duration',
  'noOfMember',
]) {
  @ApiProperty({ minimum: 100000, maximum: 500000 })
  @IsPositive()
  price_lb: number;

  @ApiProperty({ minimum: 100000, maximum: 500000 })
  @IsPositive()
  price_gb: number;
}
