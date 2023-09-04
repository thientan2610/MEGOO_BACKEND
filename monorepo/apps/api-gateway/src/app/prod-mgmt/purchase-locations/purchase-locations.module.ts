import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { PurchaseLocationsController } from './purchase-locations.controller';
import { PurchaseLocationsService } from './purchase-locations.service';
import { NestCloudinaryClientModule } from '../../file/cloudinary/cloudinary.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PROD_MGMT_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'prod-mgmt' + 'api-gateway' + 'purchase-locations',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'prod-mgmt' + 'api-gateway' + 'purchase-locations',
          },
        },
      },
    ]),
  ],
  controllers: [PurchaseLocationsController],
  providers: [PurchaseLocationsService, NestCloudinaryClientModule],
})
export class PurchaseLocationsModule {}
