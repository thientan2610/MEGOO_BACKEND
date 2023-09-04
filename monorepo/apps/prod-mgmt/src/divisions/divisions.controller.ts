import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { kafkaTopic } from '@nyp19vp-be/shared';

import { DivisionsService } from './divisions.service';
import { ProvinceService } from './province/province.service';
import { DistrictService } from './district/district.service';
import { WardService } from './ward/ward.service';

@Controller()
export class DivisionsController {
  constructor(
    private readonly divisionsService: DivisionsService,

    private readonly provinceService: ProvinceService,
    private readonly districtService: DistrictService,
    private readonly wardService: WardService,
  ) {}

  @MessagePattern(kafkaTopic.PROD_MGMT.provinces.findByCode)
  findProvinceByCode(@Payload() code: number) {
    console.log('#kafkaTopic.PROD_MGMT.provinces.findByCode: ', code);

    return this.provinceService.findByCode(+code);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.provinces.search)
  searchProvinces(@Payload() q: string) {
    console.log('#kafkaTopic.PROD_MGMT.provinces.search: ', q);

    return this.provinceService.search(q);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.districts.findByCode)
  findDistrictByCode(@Payload() code: number) {
    console.log('#kafkaTopic.PROD_MGMT.districts.findByCode: ', code);

    return this.districtService.findByCode(+code);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.districts.search)
  searchDistricts(@Payload() qp: string) {
    const [q, p] = qp.split(',');
    console.log(`#kafkaTopic.PROD_MGMT.districts.search: q = ${q},p = ${p}`);

    return this.districtService.search(q, +p);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.wards.findByCode)
  findWardByCode(@Payload() code: number) {
    console.log('#kafkaTopic.PROD_MGMT.wards.findByCode: ', code);

    return this.wardService.findByCode(+code);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.wards.search)
  searchWards(@Payload() qd: string) {
    const [q, d] = qd.split(',');
    console.log(`#kafkaTopic.PROD_MGMT.wards.search: q = ${q},d = ${d}`);

    return this.wardService.search(q, +d);
  }
}
