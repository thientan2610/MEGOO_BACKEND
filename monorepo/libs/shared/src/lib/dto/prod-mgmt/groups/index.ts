import { ApiProperty } from '@nestjs/swagger';
import { BaseResDto } from '../../base.dto';

export class GroupDto {
  id: string;
}

export class PkgMgmtInitReqDto extends GroupDto {
  @ApiProperty({ required: true })
  id: string;
}

export class PkgMgmtInitResDto extends BaseResDto {}
