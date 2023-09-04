import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GroupProductEntity } from '../entities/group-product.entity';
import { GroupEntity } from '../entities/group.entity';
import { ItemEntity } from '../entities/item.entity';
import { ProductEntity } from '../entities/product.entity';
import { PurchaseLocationEntity } from '../entities/purchase-location.entity';
import { StorageLocationEntity } from '../entities/storage-location.entity';
import { StorageLocationsController } from './storage-locations.controller';
import { StorageLocationsService } from './storage-locations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GroupEntity,
      ProductEntity,
      GroupProductEntity,
      PurchaseLocationEntity,
      StorageLocationEntity,
      ItemEntity,
    ]),
  ],
  controllers: [StorageLocationsController],
  providers: [StorageLocationsService],
})
export class StorageLocationsModule {}
