import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DistrictEntity } from '../../entities/district.entity';

import diacritics from 'diacritics';

@Injectable()
export class DistrictService {
  constructor(
    @InjectRepository(DistrictEntity)
    private readonly districtRepo: Repository<DistrictEntity>,
  ) {}

  async findByCode(code: number) {
    const d = await this.districtRepo.findOneBy({ code });

    console.log('d = ', d);

    return {
      ...d,
    };
  }

  search(q: string, p: number) {
    q = diacritics.remove(q).trim().replace(/\s+/g, '_');

    console.log('q = ', q);

    const provinceCondition = p ? ' and d.province_code = :province_code' : '';

    return this.districtRepo
      .createQueryBuilder('d')
      .select('d.*')
      .where('d.name like :name' + provinceCondition, {
        name: `%${q}%`,
      })
      .orWhere('d.codename like :codename' + provinceCondition, {
        codename: `%${q}%`,
      })
      .setParameter('province_code', p)
      .execute();
  }
}
