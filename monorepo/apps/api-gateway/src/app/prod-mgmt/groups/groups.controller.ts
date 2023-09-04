import { PkgMgmtInitReqDto } from 'libs/shared/src/lib/dto/prod-mgmt/groups';

import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { GroupsService } from './groups.service';

@ApiTags('route: prod-mgmt', 'route: prod-mgmt/groups')
@Controller('prod-mgmt/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @ApiOperation({
    summary: 'Init',
    description:
      'Init group in service, **JUST FOR TEST** the `group` will be auto created when a group created',
  })
  @Post('init')
  async init(@Body() reqDto: PkgMgmtInitReqDto) {
    return this.groupsService.init(reqDto);
  }
}
