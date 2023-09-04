import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dbCfg } from './database.config';

console.log('dbCfg', dbCfg);

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: dbCfg.host,
      port: parseInt(dbCfg.port),
      username: dbCfg.username,
      password: dbCfg.password,
      database: dbCfg.database,
      entities: [],
      autoLoadEntities: true,
      synchronize: dbCfg.synchronize,
      logging: dbCfg.logging,
    }),
  ],
})
export class DataBaseModule {}
