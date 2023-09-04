import { Module } from '@nestjs/common';
import { PkgMgmtService } from './pkg-mgmt.service';
import { PkgMgmtController } from './pkg-mgmt.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

import * as dotenv from 'dotenv';
import { ENV_FILE } from '@nyp19vp-be/shared';
import { CommModule } from '../comm/comm.module';
import { BillModule } from './bill/bill.module';
import { PackageModule } from './package/package.module';
import { TodosModule } from './todos/todos.module';
import { GroupModule } from './group/group.module';
import { TaskModule } from './task/task.module';
import { FundingModule } from './funding/funding.module';
dotenv.config({
  path: process.env.NODE_ENV !== 'dev' ? process.env.ENV_FILE : ENV_FILE.DEV,
});

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PKG_MGMT_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'pkg-mgmt' + 'api-gateway' + 'pkg-mgmt',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'pkg-mgmt-consumer' + 'api-gateway' + 'pkg-mgmt',
          },
        },
      },
      {
        name: 'AUTH_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'auth-consumer' + 'api-gateway' + 'pkg-mgmt',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'auth-consumer' + 'api-gateway' + 'pkg-mgmt',
          },
        },
      },
    ]),
    BillModule,
    PackageModule,
    TodosModule,
    GroupModule,
    CommModule,
    TaskModule,
    FundingModule,
  ],
  controllers: [PkgMgmtController],
  providers: [PkgMgmtService],
})
export class PkgMgmtModule {}
