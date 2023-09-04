import { SocketGateway } from 'apps/api-gateway/src/app/socket/socket.gateway';
import { CloneReqDto } from 'libs/shared/src/lib/dto/prod-mgmt';
import { firstValueFrom } from 'rxjs';

import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { BaseResDto, kafkaTopic } from '@nyp19vp-be/shared';

@Injectable()
export class ProdMgmtService implements OnModuleInit {
  constructor(
    @Inject('PROD_MGMT_SERVICE')
    private readonly prodMgmtClient: ClientKafka,

    private readonly socketGateway: SocketGateway,
  ) {}

  onModuleInit() {
    this.prodMgmtClient.subscribeToResponseOf(kafkaTopic.PROD_MGMT.clone);
  }

  async clone(reqDto: CloneReqDto) {
    try {
      const res = await firstValueFrom(
        this.prodMgmtClient.send<BaseResDto, CloneReqDto>(
          kafkaTopic.PROD_MGMT.clone,
          {
            ...reqDto,
          },
        ),
      );

      return res;
    } catch (error) {
      console.error('error', error);

      return {
        statusCode:
          error?.status ??
          error?.code ??
          error?.statusCode ??
          HttpStatus.INTERNAL_SERVER_ERROR,
        message: error?.message ?? 'Internal Server Error',
      };
    }
  }
}
