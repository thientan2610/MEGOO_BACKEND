import {
  ApiProperty,
  IntersectionType,
  OmitType,
  PickType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { BaseResDto, IdDto } from '../base.dto';
import { UserInfo } from '../users/users.dto';

export enum WeekDays {
  Sun,
  Mon,
  Tue,
  Wed,
  Thu,
  Fri,
  Sat,
}
export enum TimeUnit {
  Day,
  Week,
  Month,
  Year,
}
export enum State {
  Private,
  Public,
}

export class RecurrenceDto {
  @ApiProperty({ type: Number, required: true, minimum: 1, example: 1 })
  times: number;

  @ApiProperty({
    type: String,
    enum: TimeUnit,
    required: true,
    example: TimeUnit[0],
  })
  unit: string;

  @ApiProperty({
    enum: WeekDays,
    required: false,
    example: [WeekDays[0], WeekDays[6]],
  })
  @IsEnum(WeekDays, { each: true })
  @IsOptional()
  @IsArray()
  repeatOn?: string[];

  @ApiProperty({ required: false, example: new Date() })
  @IsOptional()
  ends?: Date | number;
}

class TaskDto {
  @ApiProperty({
    type: String,
    nullable: true,
    required: true,
    example: 'Meeting T_T',
  })
  summary: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({ type: Boolean, required: true, default: false })
  isRepeated: boolean;

  @ApiProperty({ required: false })
  @ValidateNested()
  @Type(() => RecurrenceDto)
  @IsOptional()
  recurrence?: RecurrenceDto;

  @ApiProperty({ required: false })
  @IsOptional()
  members?: string[];

  @ApiProperty({ type: Date, example: new Date() })
  @IsISO8601()
  startDate: Date;

  @ApiProperty({
    enum: State,
    default: State[1],
    example: State[1],
  })
  @IsEnum(State)
  state: string;

  createdBy: string;

  updatedBy: string;
}

export class CreateTaskReqDto extends IntersectionType(
  IdDto,
  OmitType(TaskDto, ['updatedBy']),
) {}

export class UpdateTaskReqDto extends IntersectionType(
  IdDto,
  OmitType(TaskDto, ['state', 'members', 'createdBy']),
) {}

export class UpdateTaskStateReqDto extends IntersectionType(
  IdDto,
  PickType(TaskDto, ['state', 'members', 'updatedBy']),
) {}

export class GetGrDto_Task extends IntersectionType(
  IdDto,
  OmitType(TaskDto, ['createdBy', 'updatedBy', 'members']),
) {
  members: UserInfo[];
  createdBy: UserInfo;
  updatedBy: UserInfo;
}

export class GetTaskResDto extends BaseResDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => GetGrDto_Task)
  task: GetGrDto_Task;
}
