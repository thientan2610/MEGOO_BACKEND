import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { NestCloudinaryClientModule } from '../../file/cloudinary/cloudinary.module';
import { GroupProductsController } from './group-products.controller';
import { GroupProductsService } from './group-products.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PROD_MGMT_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'prod-mgmt' + 'api-gateway' + 'group-products',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'prod-mgmt' + 'api-gateway' + 'group-products',
          },
        },
      },
    ]),
  ],
  controllers: [GroupProductsController],
  providers: [GroupProductsService, NestCloudinaryClientModule],
})
export class GroupProductsModule {}
