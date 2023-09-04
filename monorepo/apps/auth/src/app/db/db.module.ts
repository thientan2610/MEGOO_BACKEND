import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountEntity } from '../entities/account.entity';
import { RefreshTokenBlacklistEntity } from '../entities/refresh-token-blacklist.entity';
import { RoleEntity } from '../entities/role.entity';
import { SocialAccountEntity } from '../entities/social-media-account.entity';
import { DbService } from './db.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountEntity,
      RoleEntity,
      SocialAccountEntity,
      RefreshTokenBlacklistEntity,
    ]),
  ],
  controllers: [],
  providers: [DbService],
})
export class DbModule {}
