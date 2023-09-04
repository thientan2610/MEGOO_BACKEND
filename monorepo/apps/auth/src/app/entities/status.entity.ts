import {
    Column, Entity, JoinColumn, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, Relation
} from 'typeorm';

import { AccountEntity } from './account.entity';

export enum E_STATUS {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class StatusEmbeddedEntity {
  @Column({
    name: 'status',
    type: 'enum',
    enum: E_STATUS,
    default: E_STATUS.ACTIVE,
  })
  status: E_STATUS;

  @Column({
    name: 'last_login',
    default: null,
  })
  lastLogin: Date;

  @Column({
    name: 'last_logout',
    default: null,
  })
  lastLogout: Date;
}
