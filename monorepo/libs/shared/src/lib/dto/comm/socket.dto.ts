import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import { ObjectId } from 'mongodb';
import { BaseResDto } from '../base.dto';
import { IsOptional, ValidateNested } from 'class-validator';

export class ClientSocketReqDto {
  @ApiProperty({
    description: 'User ID',
    type: String,
    example: '640ac2ccf227ec441cd97d7b',
    required: true,
  })
  @Transform((v: TransformFnParams) => new ObjectId(v.value))
  user_id: string | string[];

  @ApiProperty({
    description: 'Client socket ID',
    type: String,
    example: '640ac2ccf227ec441cd97d7b',
    required: true,
  })
  @Transform((v: TransformFnParams) => new ObjectId(v.value))
  client_id: string;

  @IsOptional()
  status?: boolean;
}

export class ClientSocketResDto extends BaseResDto {
  @ApiProperty()
  @Type(() => ClientSocketReqDto)
  @ValidateNested()
  socket: ClientSocketReqDto;
}
