import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export * as groups from './groups';
export * as products from './products';
export * as items from './items';
export * as locations from './locations';

export class CloneReqDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  groupId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  addedBy: string;
}
