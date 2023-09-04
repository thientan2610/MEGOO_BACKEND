import { EInterval } from 'libs/shared/src/lib/dto/prod-mgmt/dto/new-group-product.dto';
import moment from 'moment';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { GroupEntity } from './group.entity';
import { TimestampEmbeddedEntity } from './timestamp.embedded.entity';

@Entity({
  name: 'new_group_products',
})
export class NewGroupProductEntity {
  @PrimaryColumn({
    name: 'id',
    type: 'uuid',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
    generated: 'uuid',
  })
  id: string;

  @Column({
    name: 'name',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
    nullable: false,
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
    name: 'price',
    nullable: true,
    default: null,
  })
  price: number;

  @Column({
    name: 'best_before',
    type: 'date',
    nullable: true,
    default: null,
  })
  bestBefore: Date;

  @Column({
    name: 'description',
    type: 'text',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
    nullable: true,
    default: null,
  })
  description: string;

  @Column({
    name: 'interval',
    type: 'int',
    nullable: false,
    default: 1,
  })
  interval: number;

  @Column({
    name: 'interval_type',
    type: 'enum',
    enum: EInterval,
    nullable: false,
    default: EInterval.MONTHLY,
  })
  intervalType: EInterval;

  @Column({
    name: 'last_notification',
    type: 'timestamp', // You might use 'date' or 'datetime' depending on your database
    nullable: true,
    default: null,
  })
  lastNotification: Date;

  @Column({
    name: 'next_notification',
    type: 'timestamp', // You might use 'date' or 'datetime' depending on your database
    nullable: true,
    default: null,
  })
  nextNotification: Date;

  @Column(() => TimestampEmbeddedEntity, {
    prefix: false,
  })
  timestamp: TimestampEmbeddedEntity;

  @ManyToOne(() => GroupEntity, (group) => group.groupProducts, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({
    name: 'group_id',
  })
  group: GroupEntity;

  applyDefaultInterval() {
    if (!this.interval) {
      this.interval = 1;
    }

    if (!this.intervalType) {
      this.intervalType = EInterval.MONTHLY;
    }
  }

  updateNextNotification() {
    const currentDate =
      moment(this.lastNotification) ||
      moment().hours(0).minutes(0).seconds(0).milliseconds(0);
    let nextNotificationDate: moment.Moment;

    switch (this.intervalType) {
      case EInterval.DAILY:
        nextNotificationDate = currentDate.clone().add(this.interval, 'days');
        break;

      case EInterval.WEEKLY:
        nextNotificationDate = currentDate.clone().add(this.interval, 'weeks');
        break;

      case EInterval.MONTHLY:
        nextNotificationDate = currentDate.clone().add(this.interval, 'months');
        break;

      case EInterval.YEARLY:
        nextNotificationDate = currentDate.clone().add(this.interval, 'years');
        break;

      default:
        return;
    }

    this.lastNotification = currentDate.toDate();
    this.nextNotification = nextNotificationDate.toDate();

    console.log('nextNotification', this.nextNotification);
  }
}
