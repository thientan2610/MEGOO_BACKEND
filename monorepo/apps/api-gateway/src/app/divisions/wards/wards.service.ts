import ms from 'ms';
import { firstValueFrom, timeout } from 'rxjs';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { kafkaTopic } from '@nyp19vp-be/shared';

@Injectable()
export class WardsService implements OnModuleInit {
  constructor(
    @Inject('PROD_MGMT_SERVICE')
    private readonly prodMgmtClient: ClientKafka,
  ) {}

  onModuleInit() {
    this.prodMgmtClient.subscribeToResponseOf(
      kafkaTopic.PROD_MGMT.wards.findByCode,
    );
    this.prodMgmtClient.subscribeToResponseOf(
      kafkaTopic.PROD_MGMT.wards.search,
    );
  }

  findByCode(code: number) {
    return firstValueFrom(
      this.prodMgmtClient
        .send(kafkaTopic.PROD_MGMT.wards.findByCode, code)
        .pipe(timeout(ms('10s'))),
    );
  }

  search(q: string, d: string) {
    console.log('wardsService.search', [q, d].join(','));

    return firstValueFrom(
      this.prodMgmtClient
        .send(kafkaTopic.PROD_MGMT.wards.search, [q, d].join(','))
        .pipe(timeout(ms('10s'))),
    );
  }
}
