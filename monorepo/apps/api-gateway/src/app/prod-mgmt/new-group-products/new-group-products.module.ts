import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { CommModule } from '../../comm/comm.module';
import { NestCloudinaryClientModule } from '../../file/cloudinary/cloudinary.module';
import { SocketModule } from '../../socket/socket.module';
import { NewGroupProductsController } from './new-group-products.controller';
import { NewGroupProductsService } from './new-group-products.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PROD_MGMT_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'prod-mgmt' + 'api-gateway' + 'new-group-products',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'prod-mgmt' + 'api-gateway' + 'new-group-products',
          },
        },
      },

      {
        name: 'PKG_MGMT_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'pkg-mgmt' + 'api-gateway' + 'new-group-prod-item',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId:
              'pkg-mgmt-consumer' + 'api-gateway' + 'new-group-prod-item',
          },
        },
      },
    ]),

    SocketModule,
    CommModule,
  ],
  controllers: [NewGroupProductsController],
  providers: [NewGroupProductsService, NestCloudinaryClientModule],
})
export class NewGroupProductsModule {}
