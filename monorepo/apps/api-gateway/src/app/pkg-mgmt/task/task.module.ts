import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { CronService } from './cron/cron.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SocketModule } from '../../socket/socket.module';
import { CommModule } from '../../comm/comm.module';
import { ENV_FILE } from '@nyp19vp-be/shared';
import { ConfigModule } from '@nestjs/config';

import * as dotenv from 'dotenv';

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
            clientId: 'pkg-mgmt' + 'api-gateway' + 'task',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'pkg-mgmt-consumer' + 'api-gateway' + 'task',
          },
        },
      },
    ]),
    SocketModule,
    CommModule,
  ],
  controllers: [TaskController],
  providers: [TaskService, CronService, Object],
})
export class TaskModule {}
