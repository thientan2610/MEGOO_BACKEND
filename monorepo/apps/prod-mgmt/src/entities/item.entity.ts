import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { GroupProductEntity } from './group-product.entity';
import { PurchaseLocationEntity } from './purchase-location.entity';
import { StorageLocationEntity } from './storage-location.entity';
import { TimestampEmbeddedEntity } from './timestamp.embedded.entity';

@Entity({
  name: 'items',
})
export class ItemEntity {
  @PrimaryColumn({
    name: 'id',
    type: 'uuid',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
    generated: 'uuid',
  })
  id: string;

  @ManyToOne(() => GroupProductEntity, (groupProduct) => groupProduct.items, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({
    name: 'group_product_id',
  })
  groupProduct: GroupProductEntity;

  @ManyToOne(
    () => PurchaseLocationEntity,
    (purchaseLocation) => purchaseLocation.items,
    {
      nullable: false,
      onDelete: 'CASCADE',
      eager: true,
    },
  )
  @JoinColumn({
    name: 'purchase_location_id',
  })
  purchaseLocation: PurchaseLocationEntity;

  @ManyToOne(
    () => StorageLocationEntity,
    (storageLocation) => storageLocation.items,
    {
      nullable: false,
      onDelete: 'CASCADE',
      eager: true,
    },
  )
  @JoinColumn({
    name: 'storage_location_id',
  })
  storageLocation: StorageLocationEntity;

  @Column({
    name: 'added_by',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
    comment: 'user info id - mongo id',
  })
  addedBy: string;

  @Column({
    name: 'best_before',
    type: 'date',
  })
  bestBefore: Date;

  @Column({
    name: 'quantity',
    type: 'int',
    default: 1,
  })
  quantity: number;

  @Column({
    name: 'unit',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
    nullable: true,
    default: null,
  })
  unit: string;

  @Column({
    name: 'image',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
    nullable: true,
    default: null,
  })
  image: string;

  @Column(() => TimestampEmbeddedEntity, {
    prefix: false,
  })
  timestamp: TimestampEmbeddedEntity;
}
