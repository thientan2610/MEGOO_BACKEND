import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

import { TimestampEmbeddedEntity } from './timestamp.embedded.entity';
import { GroupProductEntity } from './group-product.entity';
import { PurchaseLocationEntity } from './purchase-location.entity';
import { StorageLocationEntity } from './storage-location.entity';
import { NewGroupProductEntity } from './new-group-product.entity';

@Entity({
  name: 'groups',
})
export class GroupEntity {
  @PrimaryColumn({
    name: 'id',
    type: 'uuid',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
    generated: 'uuid',
  })
  id: string;

  @OneToMany(() => GroupProductEntity, (groupProduct) => groupProduct.group, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    lazy: true,
  })
  groupProducts: Promise<GroupProductEntity[]>;

  @OneToMany(
    () => NewGroupProductEntity,
    (newGroupProduct) => newGroupProduct.group,
    {
      cascade: true,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      lazy: true,
    },
  )
  newGroupProducts: Promise<NewGroupProductEntity[]>;

  @OneToMany(
    () => PurchaseLocationEntity,
    (purchaseLocation) => purchaseLocation.group,
    {
      cascade: true,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      lazy: true,
    },
  )
  purchaseLocations: Promise<PurchaseLocationEntity[]>;

  @OneToMany(
    () => StorageLocationEntity,
    (storageLocation) => storageLocation.group,
    {
      cascade: true,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      lazy: true,
    },
  )
  storageLocations: Promise<StorageLocationEntity[]>;

  @Column(() => TimestampEmbeddedEntity, {
    prefix: false,
  })
  timestamp: TimestampEmbeddedEntity;
}
