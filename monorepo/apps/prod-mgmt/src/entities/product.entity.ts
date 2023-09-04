import { Column, Entity, PrimaryColumn } from 'typeorm';

import { TimestampEmbeddedEntity } from './timestamp.embedded.entity';

/**
 * This entity is used to cache the product data from `go-upc` api
 */
@Entity({
  name: 'products',
})
export class ProductEntity {
  @PrimaryColumn({
    name: 'id',
    type: 'uuid',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
    generated: 'uuid',
    primaryKeyConstraintName: 'PK_products_id',
  })
  id: string;

  @Column({
    name: 'name',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
    default: '',
  })
  name: string;

  @Column({
    name: 'image',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
    nullable: false,
    default:
      'https://res.cloudinary.com/nightowls19vp/image/upload/v1687419179/default.png',
  })
  image: string;

  @Column({
    name: 'barcode',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
    unique: true,
    nullable: true,
    default: null,
  })
  barcode: string;

  @Column({
    name: 'price',
    nullable: true,
    default: null,
  })
  price: number;

  @Column({
    name: 'region',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
    nullable: true,
    default: null,
  })
  region: string;

  @Column({
    name: 'brand',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
    nullable: true,
    default: null,
  })
  brand: string;

  @Column({
    name: 'category',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
    nullable: true,
    default: null,
  })
  category: string;

  @Column({
    name: 'description',
    type: 'text',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
    nullable: true,
    default: null,
  })
  description: string;

  @Column(() => TimestampEmbeddedEntity, {
    prefix: false,
  })
  timestamp: TimestampEmbeddedEntity;
}
