import ms from 'ms';
import { firstValueFrom, timeout } from 'rxjs';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { kafkaTopic } from '@nyp19vp-be/shared';

@Injectable()
export class DistrictsService implements OnModuleInit {
  constructor(
    @Inject('PROD_MGMT_SERVICE')
    private readonly prodMgmtClient: ClientKafka,
  ) {}

  onModuleInit() {
    this.prodMgmtClient.subscribeToResponseOf(
      kafkaTopic.PROD_MGMT.districts.findByCode,
    );
    this.prodMgmtClient.subscribeToResponseOf(
      kafkaTopic.PROD_MGMT.districts.search,
    );
  }

  findByCode(code: number) {
    return firstValueFrom(
      this.prodMgmtClient
        .send(kafkaTopic.PROD_MGMT.districts.findByCode, code)
        .pipe(timeout(ms('10s'))),
    );
  }

  search(q: string, p: string) {
    console.log('districtsService.search', [q, p].join(','));

    return firstValueFrom(
      this.prodMgmtClient
        .send(kafkaTopic.PROD_MGMT.districts.search, [q, p].join(','))
        .pipe(timeout(ms('10s'))),
    );
  }
}
