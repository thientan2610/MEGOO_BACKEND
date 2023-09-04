import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { dbCfg, getMongoConnectionString } from './database.config';

@Module({
  imports: [MongooseModule.forRoot(getMongoConnectionString(dbCfg))],
})
export class DataBaseModule {}
