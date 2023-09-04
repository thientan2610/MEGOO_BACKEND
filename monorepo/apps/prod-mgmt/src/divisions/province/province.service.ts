import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProvinceEntity } from '../../entities/province.entity';
import { Repository } from 'typeorm';

import diacritics from 'diacritics';

@Injectable()
export class ProvinceService {
  constructor(
    @InjectRepository(ProvinceEntity)
    private readonly provinceRepo: Repository<ProvinceEntity>,
  ) {}

  async findByCode(code: number) {
    const p = await this.provinceRepo.findOneBy({ code });

    console.log('p = ', p);

    return {
      ...p,
    };
  }

  search(q: string) {
    q = diacritics.remove(q).trim().replace(/\s+/g, '_');

    console.log('q = ', q);

    return this.provinceRepo
      .createQueryBuilder('p')
      .select('p.*')
      .where('p.name like :name', { name: `%${q}%` })
      .orWhere('p.codename like :codename', { codename: `%${q}%` })
      .execute();
  }
}
