import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { kafkaTopic } from '@nyp19vp-be/shared';
import { DbInitService } from './db-init/db-init.service';
import { CloneReqDto } from 'libs/shared/src/lib/dto/prod-mgmt';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,

    private readonly dbInitService: DbInitService,
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.clone)
  cloneGroup(@Payload() data: CloneReqDto) {
    console.log('#kafkaTopic.PROD_MGMT.clone: ', data);

    return this.dbInitService.cloneData(data.groupId, data.addedBy);
  }
}
