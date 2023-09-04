import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Package, PackageSchema } from '../../schemas/package.schema';
import { InitDbService } from './init-db.service';
import { DataBaseModule } from '../database/database.module';

@Module({
  imports: [
    DataBaseModule,
    MongooseModule.forFeature([{ name: Package.name, schema: PackageSchema }]),
  ],
  providers: [InitDbService],
})
export class InitDbModule {}
