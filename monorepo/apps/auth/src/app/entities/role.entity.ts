import {
    Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn
} from 'typeorm';

import { ERole } from '@nyp19vp-be/shared';

import { ROLE } from '../constants/entities';

@Entity({
  name: ROLE,
})
export class RoleEntity {
  @PrimaryGeneratedColumn('increment', {
    name: 'role_id',
  })
  roleId: number;

  @Column({
    name: 'role_name',
    type: 'enum',
    enum: ERole,
    default: ERole.user,
  })
  roleName: ERole;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
  })
  deletedAt: Date;
}
