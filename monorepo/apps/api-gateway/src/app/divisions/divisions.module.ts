import { Module } from '@nestjs/common';
import { DivisionsService } from './divisions.service';
import { DivisionsController } from './divisions.controller';
import { ProvincesModule } from './provinces/provinces.module';
import { DistrictsModule } from './districts/districts.module';
import { WardsModule } from './wards/wards.module';

@Module({
  controllers: [DivisionsController],
  providers: [DivisionsService],
  imports: [ProvincesModule, DistrictsModule, WardsModule],
})
export class DivisionsModule {}
