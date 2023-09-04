import { Module } from '@nestjs/common';
import { DataBaseModule } from '../core/database/database.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PackageModule } from './package/package.module';
import { GroupModule } from './group/group.module';
import { InitDbModule } from '../core/init-db/init-db.module';
import { BillModule } from './bill/bill.module';
import { TodosModule } from './todos/todos.module';
import { TaskModule } from './task/task.module';
import { FundingModule } from './funding/funding.module';

@Module({
  imports: [
    PackageModule,
    DataBaseModule,
    GroupModule,
    InitDbModule,
    BillModule,
    TodosModule,
    TaskModule,
    FundingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
