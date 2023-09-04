import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GroupsService } from './groups.service';
import { kafkaTopic } from '@nyp19vp-be/shared';
import { PkgMgmtInitReqDto } from 'libs/shared/src/lib/dto/prod-mgmt/groups';

@Controller()
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @MessagePattern(kafkaTopic.PROD_MGMT.init)
  init(@Payload() data: PkgMgmtInitReqDto) {
    console.log('#kafkaTopic.PROD_MGMT.init', data);

    return this.groupsService.init(data);
  }
}
