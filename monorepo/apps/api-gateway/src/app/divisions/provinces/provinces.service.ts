import ms from 'ms';
import { firstValueFrom, timeout } from 'rxjs';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { kafkaTopic } from '@nyp19vp-be/shared';

@Injectable()
export class ProvincesService implements OnModuleInit {
  constructor(
    @Inject('PROD_MGMT_SERVICE')
    private readonly prodMgmtClient: ClientKafka,
  ) {}

  onModuleInit() {
    this.prodMgmtClient.subscribeToResponseOf(
      kafkaTopic.PROD_MGMT.provinces.findByCode,
    );
    this.prodMgmtClient.subscribeToResponseOf(
      kafkaTopic.PROD_MGMT.provinces.search,
    );
  }

  findByCode(code: number) {
    return firstValueFrom(
      this.prodMgmtClient
        .send(kafkaTopic.PROD_MGMT.provinces.findByCode, code)
        .pipe(timeout(ms('10s'))),
    );
  }

  search(q: string) {
    console.log('ProvincesService.search', q);

    return firstValueFrom(
      this.prodMgmtClient
        .send(kafkaTopic.PROD_MGMT.provinces.search, q)
        .pipe(timeout(ms('10s'))),
    );
  }
}
