import {
  PkgMgmtInitReqDto,
  PkgMgmtInitResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/groups';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { kafkaTopic } from '@nyp19vp-be/shared';

@Injectable()
export class GroupsService implements OnModuleInit {
  constructor(
    @Inject('PROD_MGMT_SERVICE')
    private readonly prodMgmtClient: ClientKafka,
  ) {}
  onModuleInit() {
    this.prodMgmtClient.subscribeToResponseOf(kafkaTopic.PROD_MGMT.init);
  }

  init(reqDto: PkgMgmtInitReqDto) {
    return this.prodMgmtClient.send<PkgMgmtInitResDto, PkgMgmtInitReqDto>(
      kafkaTopic.PROD_MGMT.init,
      {
        ...reqDto,
      },
    );
  }
}
