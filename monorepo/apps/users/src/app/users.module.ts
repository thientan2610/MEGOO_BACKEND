import { Module } from '@nestjs/common';
import { DataBaseModule } from '../core/database/database.module';
import { UsersCrudModule } from './users-crud/users-crud.module';

import { AppController } from './users.controller';
import { AppService } from './users.service';

@Module({
  imports: [UsersCrudModule, DataBaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
