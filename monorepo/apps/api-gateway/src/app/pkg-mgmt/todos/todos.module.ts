import { Module } from '@nestjs/common';
import { TodosService } from './todos.service';
import { TodosController } from './todos.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SocketModule } from '../../socket/socket.module';
import { CommModule } from '../../comm/comm.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PKG_MGMT_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'pkg-mgmt' + 'api-gateway' + 'todos',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'pkg-mgmt-consumer' + 'api-gateway' + 'todos',
          },
        },
      },
    ]),
    SocketModule,
    CommModule,
  ],
  controllers: [TodosController],
  providers: [TodosService],
})
export class TodosModule {}
