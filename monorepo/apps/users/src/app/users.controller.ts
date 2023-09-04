import { kafkaTopic } from '@nyp19vp-be/shared';
import { Controller, Get } from '@nestjs/common';

import { AppService } from './users.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  // @MessagePattern(kafkaTopic.HEALT_CHECK.USERS)
  // healthcheck(): string {
  //   console.log(`user-svc#${kafkaTopic.HEALT_CHECK.USERS}`);

  //   return 'ok  ';
  // }
}
