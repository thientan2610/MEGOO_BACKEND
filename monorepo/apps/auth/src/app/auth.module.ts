import { join } from 'path';

import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ENV_FILE } from '@nyp19vp-be/shared';

import { DataBaseModule } from '../core/database/database.module';
import { AuthController } from './controller/auth.controller';
import { DbModule } from './db/db.module';
import { AccountEntity } from './entities/account.entity';
import { RefreshTokenBlacklistEntity } from './entities/refresh-token-blacklist.entity';
import { RoleEntity } from './entities/role.entity';
import { SocialAccountEntity } from './entities/social-media-account.entity';
import { AccountService } from './services/account.service';
import { ActionService } from './services/action.service';
import { AuthService } from './services/auth.service';
import { RefreshTokenBlacklistService } from './services/refresh-token-blacklist.service';
import { RoleService } from './services/role.service';

import * as dotenv from 'dotenv';
import { TokenEntity } from './entities/token.entity';

console.log('NODE_ENV: ', process.env.NODE_ENV);

dotenv.config({
  path: process.env.NODE_ENV !== 'dev' ? process.env.ENV_FILE : ENV_FILE.DEV,
});

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        return {
          transport: {
            host: config.get('MAIL_HOST'),
            secure: config.get('NODE_ENV') !== 'dev',
            auth: {
              user: config.get('MAIL_USER'),
              pass: config.get('MAIL_PASSWORD'),
            },
            tls: {
              rejectUnauthorized: config.get('NODE_ENV') === 'dev',
            },
          },
          defaults: {
            from: config.get('MAIL_FROM'),
          },
          template: {
            dir: join(__dirname, 'assets/templates/email'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV !== 'dev' ? process.env.ENV_FILE : ENV_FILE.DEV,
    }),
    ClientsModule.register([
      {
        name: 'USERS_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'users' + 'auth' + 'users',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'users-consumer' + 'auth' + 'users',
          },
        },
      },
      {
        name: 'PKG_MGMT_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'pkg-mgmt' + 'auth' + 'pkg-mgmt',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'pkg-mgmt-consumer' + 'auth' + 'pkg-mgmt',
          },
        },
      },
    ]),
    DataBaseModule,
    JwtModule,
    TypeOrmModule.forFeature([
      AccountEntity,
      SocialAccountEntity,
      RoleEntity,
      RefreshTokenBlacklistEntity,
      TokenEntity,
    ]),
    DbModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccountService,
    RoleService,
    ActionService,
    RefreshTokenBlacklistService,
  ],
  exports: [
    AuthService,
    AccountService,
    RoleService,
    ActionService,
    RefreshTokenBlacklistService,
  ],
})
export class AuthModule {}
