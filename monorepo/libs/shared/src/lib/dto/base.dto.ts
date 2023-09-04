import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { ObjectId } from 'mongodb';

export class BaseResDto {
  @ApiProperty({ description: 'Response status code', example: HttpStatus.OK })
  statusCode: HttpStatus;

  @ApiProperty({ description: 'Response message', maxLength: 255 })
  message: string;

  @ApiProperty({
    description: 'Error message',
  })
  errCode?: string;

  @ApiProperty({ description: 'Error message' })
  @IsOptional()
  error?: string;

  @ApiProperty({ description: 'Data' })
  @IsOptional()
  data?: unknown;
}

export class IdDto {
  @Transform((v: TransformFnParams) => new ObjectId(v.value))
  _id: string;
}
