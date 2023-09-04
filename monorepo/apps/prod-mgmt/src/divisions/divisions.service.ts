import axios from 'axios';
import { Repository } from 'typeorm';

import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { DistrictEntity } from '../entities/district.entity';
import { ProvinceEntity } from '../entities/province.entity';
import { WardEntity } from '../entities/ward.entity';

import * as https from 'https';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

@Injectable()
export class DivisionsService implements OnModuleInit {
  private static apiHost = 'https://provinces.open-api.vn/api/';
  private static provinceEndpoint = 'p/';
  private static districtEndpoint = 'd/';
  private static wardEndpoint = 'w/';

  private static isInit = false;

  constructor(
    @InjectRepository(ProvinceEntity)
    private readonly provinceRepo: Repository<ProvinceEntity>,

    @InjectRepository(DistrictEntity)
    private readonly districtRepo: Repository<DistrictEntity>,

    @InjectRepository(WardEntity)
    private readonly wardRepo: Repository<WardEntity>,
  ) {}

  getData(): { message: string } {
    return { message: 'Welcome to prod-mgmt!' };
  }

  async onModuleInit() {
    DivisionsService.isInit = true;

    const logger = setInterval(() => {
      if (DivisionsService.isInit) {
        console.log('DivisionsService is initialized: ' + new Date());
      } else {
        clearInterval(logger);
        console.log('DivisionsService initialized successfully: ' + new Date());
      }
    }, 1e3);

    try {
      await this.saveProvince();
      await this.saveDistrict();
      await this.saveWard();
    } catch (error) {
      console.log(error);

      console.log('DivisionsService initialized failed: ' + new Date());
    }
    DivisionsService.isInit = false;
  }

  async saveProvince() {
    if ((await this.provinceRepo.count()) !== 0) {
      return;
    }

    const provinces = await axios.get(
      DivisionsService.apiHost + DivisionsService.provinceEndpoint,
      { httpsAgent },
    );

    const provinceEntities = provinces.data.map((province) => {
      const provinceEntity = new ProvinceEntity();
      provinceEntity.code = province.code;
      provinceEntity.name = province.name;
      provinceEntity.division_type = province.division_type;
      provinceEntity.codename = province.codename;
      provinceEntity.phone_code = province.phone_code;
      return provinceEntity;
    });

    await this.provinceRepo.save(provinceEntities);
  }

  async saveDistrict() {
    if ((await this.districtRepo.count()) !== 0) {
      return;
    }

    const districts = await axios.get(
      DivisionsService.apiHost + DivisionsService.districtEndpoint,
      { httpsAgent },
    );

    const districtEntities = districts.data.map((district) => {
      const districtEntity = new DistrictEntity();
      districtEntity.code = district.code;
      districtEntity.name = district.name;
      districtEntity.division_type = district.division_type;
      districtEntity.codename = district.codename;
      districtEntity.province = district.province_code;
      return districtEntity;
    });

    await this.districtRepo.save(districtEntities);
  }

  async saveWard() {
    if ((await this.wardRepo.count()) !== 0) {
      return;
    }

    const wards = await axios.get(
      DivisionsService.apiHost + DivisionsService.wardEndpoint,
      { httpsAgent },
    );

    const wardEntities = wards.data.map((ward) => {
      const wardEntity = new WardEntity();
      wardEntity.code = ward.code;
      wardEntity.name = ward.name;
      wardEntity.division_type = ward.division_type;
      wardEntity.codename = ward.codename;
      wardEntity.district = ward.district_code;
      return wardEntity;
    });

    await this.wardRepo.save(wardEntities);
  }
}
