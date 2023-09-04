import { Module } from '@nestjs/common';
import { NewGroupsProductsService } from './new-groups-products.service';
import { GroupsProductsController } from './new-groups-products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupProductEntity } from '../entities/group-product.entity';
import { GroupEntity } from '../entities/group.entity';
import { ItemEntity } from '../entities/item.entity';
import { ProductEntity } from '../entities/product.entity';
import { PurchaseLocationEntity } from '../entities/purchase-location.entity';
import { StorageLocationEntity } from '../entities/storage-location.entity';
import { NewGroupProductEntity } from '../entities/new-group-product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GroupEntity,
      ProductEntity,
      GroupProductEntity,
      NewGroupProductEntity,
      PurchaseLocationEntity,
      StorageLocationEntity,
      ItemEntity,
    ]),
  ],
  controllers: [GroupsProductsController],
  providers: [NewGroupsProductsService],
})
export class NewGroupsProductsModule {}
