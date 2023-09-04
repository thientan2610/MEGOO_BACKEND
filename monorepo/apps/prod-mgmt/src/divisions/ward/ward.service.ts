import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WardEntity } from '../../entities/ward.entity';

import diacritics from 'diacritics';

@Injectable()
export class WardService {
  constructor(
    @InjectRepository(WardEntity)
    private readonly wardRepo: Repository<WardEntity>,
  ) {}

  async findByCode(code: number) {
    const w = await this.wardRepo.findOneBy({ code });

    console.log('ward = ', w);

    return {
      ...w,
    };
  }

  search(q: string, d: number) {
    q = diacritics.remove(q).trim().replace(/\s+/g, '_');

    console.log('q = ', q);

    const districtCondition = d ? ' and w.district_code = :district_code' : '';

    const qb = this.wardRepo
      .createQueryBuilder('w')
      .select('w.*')
      .where('w.name like :name' + districtCondition, {
        name: `%${q}%`,
      })
      .orWhere('w.codename like :codename' + districtCondition, {
        codename: `%${q}%`,
      })
      .setParameter('district_code', d);

    return qb.execute();
  }
}
