import { CommModule } from 'apps/api-gateway/src/app/comm/comm.module';
import { GroupProductsModule } from 'apps/api-gateway/src/app/prod-mgmt/group-products/group-products.module';
import { GroupsModule } from 'apps/api-gateway/src/app/prod-mgmt/groups/groups.module';
import { ItemsModule } from 'apps/api-gateway/src/app/prod-mgmt/items/items.module';
import { ProdMgmtController } from 'apps/api-gateway/src/app/prod-mgmt/prod-mgmt.controller';
import { ProdMgmtService } from 'apps/api-gateway/src/app/prod-mgmt/prod-mgmt.service';
import { ProductsModule } from 'apps/api-gateway/src/app/prod-mgmt/products/products.module';
import { ProductsService } from 'apps/api-gateway/src/app/prod-mgmt/products/products.service';
import { PurchaseLocationsModule } from 'apps/api-gateway/src/app/prod-mgmt/purchase-locations/purchase-locations.module';
import { PurchaseLocationsService } from 'apps/api-gateway/src/app/prod-mgmt/purchase-locations/purchase-locations.service';
import { StorageLocationsModule } from 'apps/api-gateway/src/app/prod-mgmt/storage-locations/storage-locations.module';
import { StorageLocationsService } from 'apps/api-gateway/src/app/prod-mgmt/storage-locations/storage-locations.service';
import { SocketModule } from 'apps/api-gateway/src/app/socket/socket.module';

import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { NewGroupProductsModule } from './new-group-products/new-group-products.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PROD_MGMT_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'prod-mgmt' + 'api-gateway' + 'app',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'prod-mgmt' + 'api-gateway' + 'app',
          },
        },
      },
    ]),
    GroupsModule,
    ProductsModule,
    GroupProductsModule,
    NewGroupProductsModule,
    ItemsModule,
    PurchaseLocationsModule,
    StorageLocationsModule,

    SocketModule,
    CommModule,
  ],
  controllers: [ProdMgmtController],
  providers: [
    ProdMgmtService,
    ProductsService,
    PurchaseLocationsService,
    StorageLocationsService,
  ],
})
export class ProdMgmtModule {}
