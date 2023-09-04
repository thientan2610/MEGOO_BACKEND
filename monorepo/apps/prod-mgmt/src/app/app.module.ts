import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DataBaseModule } from '../core/database/database.module';
import { DistrictService } from '../divisions/district/district.service';
import { DivisionsModule } from '../divisions/divisions.module';
import { ProvinceService } from '../divisions/province/province.service';
import { WardService } from '../divisions/ward/ward.service';
import { DistrictEntity } from '../entities/district.entity';
import { GroupProductEntity } from '../entities/group-product.entity';
import { GroupEntity } from '../entities/group.entity';
import { ItemEntity } from '../entities/item.entity';
import { NewGroupProductEntity } from '../entities/new-group-product.entity';
import { ProductEntity } from '../entities/product.entity';
import { ProvinceEntity } from '../entities/province.entity';
import { PurchaseLocationEntity } from '../entities/purchase-location.entity';
import { StorageLocationEntity } from '../entities/storage-location.entity';
import { WardEntity } from '../entities/ward.entity';
import { GroupsProductsModule } from '../groups-products/groups-products.module';
import { GroupsModule } from '../groups/groups.module';
import { ItemsModule } from '../items/items.module';
import { NewGroupsProductsModule } from '../new-groups-products/new-groups-products.module';
import { NewGroupsProductsService } from '../new-groups-products/new-groups-products.service';
import { ProductsModule } from '../products/products.module';
import { ProductsService } from '../products/products.service';
import { PurchaseLocationsModule } from '../purchase-locations/purchase-locations.module';
import { StorageLocationsModule } from '../storage-locations/storage-locations.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbInitService } from './db-init/db-init.service';

@Module({
  imports: [
    DataBaseModule,
    GroupsModule,
    ProductsModule,
    GroupsProductsModule,
    NewGroupsProductsModule,
    ItemsModule,
    DivisionsModule,
    PurchaseLocationsModule,
    StorageLocationsModule,

    TypeOrmModule.forFeature([
      GroupEntity,
      ProductEntity,
      GroupProductEntity,
      NewGroupProductEntity,
      PurchaseLocationEntity,
      StorageLocationEntity,
      ItemEntity,
      ProvinceEntity,
      DistrictEntity,
      WardEntity,
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    DbInitService,
    ProductsService,
    NewGroupsProductsService,
    ProvinceService,
    DistrictService,
    WardService,
  ],
})
export class AppModule {}
