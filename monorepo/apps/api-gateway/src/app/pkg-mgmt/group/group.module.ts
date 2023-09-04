import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommModule } from '../../comm/comm.module';
import { SocketModule } from '../../socket/socket.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PKG_MGMT_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'pkg-mgmt' + 'api-gateway' + 'group',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'pkg-mgmt-consumer' + 'api-gateway' + 'group',
          },
        },
      },
      {
        name: 'AUTH_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'auth-consumer' + 'api-gateway' + 'pkg-mgmt-group',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'auth-consumer' + 'api-gateway' + 'pkg-mgmt-group',
          },
        },
      },
    ]),
    CommModule,
    SocketModule,
  ],
  controllers: [GroupController],
  providers: [GroupService],
})
export class GroupModule {}
