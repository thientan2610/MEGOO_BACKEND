import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { SOCIAL_MEDIA_ACCOUNT } from '../constants/entities/index';
import { AccountEntity } from './account.entity';

@Entity({
  name: SOCIAL_MEDIA_ACCOUNT,
})
export class SocialAccountEntity {
  @PrimaryColumn({
    name: 'platform',
    nullable: false,
  })
  platform: string;

  @PrimaryColumn({
    name: 'platform_id',
  })
  platformId: string;

  @ManyToOne(() => AccountEntity, (account) => account.socialAccounts, {
    eager: true,
  })
  @JoinColumn({
    name: 'account_id',
  })
  account: AccountEntity;

  @Column({
    name: 'account_id',
    nullable: false,
  })
  accountId: string;
}
