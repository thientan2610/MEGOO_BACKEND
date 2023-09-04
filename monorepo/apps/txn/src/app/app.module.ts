import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TxnCrudModule } from './txn-crud/txn-crud.module';
import { DataBaseModule } from '../core/database/database.module';

@Module({
  imports: [TxnCrudModule, DataBaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
