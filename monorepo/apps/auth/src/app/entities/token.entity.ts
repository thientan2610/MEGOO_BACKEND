import { TimestampEmbeddedEntity } from './timestamp.embedded.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class TokenEntity {
  @PrimaryGeneratedColumn('uuid', {
    name: 'id',
  })
  id: string;

  @Column({
    name: 'hash_token',
    unique: false,
    comment: 'Hashed token - use sha256',
    default: null,
  })
  hashToken: string;

  @Column({
    name: 'left_time',
    unique: false,
    comment: 'Left time to live',
    default: 0,
  })
  leftTime: number;

  @Column({
    name: 'expired_at',
    unique: false,
    comment: 'Expired at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  expiredAt: Date;

  timestamp: TimestampEmbeddedEntity;
}
