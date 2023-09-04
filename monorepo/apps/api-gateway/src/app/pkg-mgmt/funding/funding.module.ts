import { Module } from '@nestjs/common';
import { FundingService } from './funding.service';
import { FundingController } from './funding.controller';
import { CommModule } from '../../comm/comm.module';
import { SocketModule } from '../../socket/socket.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';

import * as dotenv from 'dotenv';
import { ENV_FILE } from '@nyp19vp-be/shared';

dotenv.config({
  path: process.env.NODE_ENV !== 'dev' ? process.env.ENV_FILE : ENV_FILE.DEV,
});

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV !== 'dev' ? process.env.ENV_FILE : ENV_FILE.DEV,
    }),
    ClientsModule.register([
      {
        name: 'PKG_MGMT_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'pkg-mgmt' + 'api-gateway' + 'funding',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'pkg-mgmt-consumer' + 'api-gateway' + 'funding',
          },
        },
      },
    ]),
    SocketModule,
    CommModule,
  ],
  controllers: [FundingController],
  providers: [FundingService, Object],
})
export class FundingModule {}
