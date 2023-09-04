import { Entity, Column, OneToMany, PrimaryColumn } from 'typeorm';
import { DistrictEntity } from './district.entity';

@Entity('provinces')
export class ProvinceEntity {
  @PrimaryColumn({
    name: 'code',
    type: 'int',
    generated: 'increment',
  })
  code: number;

  @Column({
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
  })
  name: string;

  @Column({
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
  })
  division_type: string;

  @Column({
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_520_ci',
  })
  codename: string;

  @Column({
    name: 'phone_code',
  })
  phone_code: number;

  @OneToMany(() => DistrictEntity, (district) => district.province, {
    lazy: true,
  })
  districts: Promise<DistrictEntity[]>;
}
