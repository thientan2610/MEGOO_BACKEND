import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { NestCloudinaryClientModule } from '../../file/cloudinary/cloudinary.module';
import { StorageLocationsController } from './storage-locations.controller';
import { StorageLocationsService } from './storage-locations.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PROD_MGMT_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'prod-mgmt' + 'api-gateway' + 'storage-locations',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'prod-mgmt' + 'api-gateway' + 'storage-locations',
          },
        },
      },
    ]),
  ],
  controllers: [StorageLocationsController],
  providers: [StorageLocationsService, NestCloudinaryClientModule],
})
export class StorageLocationsModule {}
