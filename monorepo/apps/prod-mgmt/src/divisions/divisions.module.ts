import { Module } from '@nestjs/common';
import { DivisionsService } from './divisions.service';
import { DivisionsController } from './divisions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DistrictEntity } from '../entities/district.entity';
import { ProvinceEntity } from '../entities/province.entity';
import { WardEntity } from '../entities/ward.entity';
import { ProvinceService } from './province/province.service';
import { DistrictService } from './district/district.service';
import { WardService } from './ward/ward.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProvinceEntity, DistrictEntity, WardEntity]),
  ],
  controllers: [DivisionsController],
  providers: [DivisionsService, ProvinceService, DistrictService, WardService],
})
export class DivisionsModule {}
