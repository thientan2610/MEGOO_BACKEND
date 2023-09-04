import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PkgMgmtModule } from './pkg-mgmt/pkg-mgmt.module';
import { FileModule } from './file/file.module';
import { TxnModule } from './txn/txn.module';

import * as dotenv from 'dotenv';
import { ENV_FILE } from '@nyp19vp-be/shared';
import { SocketModule } from './socket/socket.module';
import { CommModule } from './comm/comm.module';
import { ProdMgmtModule } from './prod-mgmt/prod-mgmt.module';
import { DivisionsModule } from './divisions/divisions.module';
dotenv.config({
  path: process.env.NODE_ENV !== 'dev' ? process.env.ENV_FILE : ENV_FILE.DEV,
});

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'auth' + 'api-gateway' + 'app',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'auth-consumer' + 'api-gateway' + 'app',
          },
        },
      },
      {
        name: 'USERS_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'users' + 'api-gateway' + 'app',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'users-consumer' + 'api-gateway' + 'app',
          },
        },
      },
    ]),
    AuthModule,
    UsersModule,
    PkgMgmtModule,
    FileModule,
    TxnModule,
    SocketModule,
    CommModule,
    ProdMgmtModule,
    DivisionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
