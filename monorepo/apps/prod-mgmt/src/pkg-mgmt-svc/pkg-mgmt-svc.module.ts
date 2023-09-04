import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GroupProductEntity } from '../entities/group-product.entity';
import { GroupEntity } from '../entities/group.entity';
import { ItemEntity } from '../entities/item.entity';
import { ProductEntity } from '../entities/product.entity';
import { PurchaseLocationEntity } from '../entities/purchase-location.entity';
import { StorageLocationEntity } from '../entities/storage-location.entity';
import { PkgMgmtSvcController } from './pkg-mgmt-svc.controller';
import { PkgMgmtSvcService } from './pkg-mgmt-svc.service';

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
  controllers: [PkgMgmtSvcController],
  providers: [PkgMgmtSvcService],
})
export class PkgMgmtSvcModule {}
