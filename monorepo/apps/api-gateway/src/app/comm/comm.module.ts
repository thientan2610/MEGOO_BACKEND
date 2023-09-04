import { Module } from '@nestjs/common';
import { CommService } from './comm.service';
import { CommController } from './comm.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'COMM_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'comm' + 'api-gateway' + 'comm',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'comm-consumer' + 'api-gateway' + 'comm',
          },
        },
      },
    ]),
  ],
  controllers: [CommController],
  providers: [CommService],
  exports: [CommService],
})
export class CommModule {}
