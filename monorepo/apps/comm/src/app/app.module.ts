import { Module } from '@nestjs/common';
import { DataBaseModule } from '../core/database/database.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocketCrudModule } from './socket-crud/socket-crud.module';

@Module({
  imports: [DataBaseModule, SocketCrudModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
