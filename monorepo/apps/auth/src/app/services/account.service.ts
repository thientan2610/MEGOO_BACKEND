import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { toMs } from 'libs/shared/src/lib/utils';
import { firstValueFrom, timeout } from 'rxjs';
import { DataSource, Repository } from 'typeorm';

import { Inject, Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common/enums';
import { ClientKafka } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseResDto,
  CreateAccountReqDto,
  CreateAccountResDto,
  CreateUserReqDto,
  ERole,
  GetUserResDto,
  IJwtPayload,
  kafkaTopic,
  SocialLinkReqDto,
  SocialLinkResDto,
  SocialSignupReqDto,
  SocialSignupResDto,
  UserDto,
} from '@nyp19vp-be/shared';

import { AccountEntity } from '../entities/account.entity';
import { RoleEntity } from '../entities/role.entity';
import { SocialAccountEntity } from '../entities/social-media-account.entity';
import { AuthService } from './auth.service';
import { MailerService } from '@nestjs-modules/mailer';
import { sendMailWithRetries } from '../utils/mail';

import * as dotenv from 'dotenv';
import { ENV_FILE } from '@nyp19vp-be/shared';
dotenv.config({
  path: process.env.NODE_ENV !== 'dev' ? process.env.ENV_FILE : ENV_FILE.DEV,
});
@Injectable()
export class AccountService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(AccountEntity)
    private accountRepo: Repository<AccountEntity>,

    @InjectRepository(RoleEntity)
    private roleRepo: Repository<RoleEntity>,

    @InjectRepository(SocialAccountEntity)
    private socialAccRepo: Repository<SocialAccountEntity>,

    private readonly authService: AuthService,

    private readonly mailService: MailerService,

    @Inject('USERS_SERVICE') private readonly usersClient: ClientKafka,
  ) {}
  getData(): { message: string } {
    return { message: 'Welcome to auth/Account service!' };
  }

  async create(
    reqDto: CreateAccountReqDto,
    platform: string = null,
    platformId: string = null,
  ): Promise<CreateAccountResDto> {
    sendMailWithRetries(this.mailService, {
      to: reqDto.email,
      subject: 'Welcome to NYP19VP',
      template: 'welcome.hbs',
      context: {
        name: reqDto.name,
        link: process?.env?.FE_URL || 'http://localhost:8080',
      },
    });

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(reqDto.password, salt);

    reqDto.password = hash;

    const roleUser = await this.roleRepo.findOneBy({
      roleName: reqDto?.roleName || ERole.user,
    });

    const account: AccountEntity = this.accountRepo.create({
      username: reqDto.username,
      hashedPassword: !reqDto ? null : reqDto.password, // set password to null
      email: reqDto.email,
      role: roleUser,
    });

    let saveResult = null;
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // await send user profile to users service
      const createUserReq: CreateUserReqDto = {
        email: reqDto.username,
        dob: reqDto.dob,
        name: reqDto.name,
        phone: reqDto.phone,
        avatar: reqDto.avatar,
        role: roleUser.roleName,
      };

      if (platform && platformId) {
        const socialMediaAccount: SocialAccountEntity =
          this.socialAccRepo.create({
            account: saveResult,
            platform: platform,
            platformId: platformId,
          });

        saveResult = await queryRunner.manager.save<SocialAccountEntity>(
          socialMediaAccount,
        );
      }

      const createUserRes = await firstValueFrom(
        this.usersClient.send(
          kafkaTopic.USERS.CREATE,
          JSON.stringify(createUserReq),
        ),
      );

      if (createUserRes.error) {
        console.log('roll back');

        throw new Error(createUserRes.error);
      }
      account.userInfoId = createUserRes.data?.['_id'] || null;

      if (account.userInfoId === null) {
        throw new Error('create user fail');
      }

      saveResult = await queryRunner.manager.save<AccountEntity>(account);

      // not use await here, because we want to send email in background
      sendMailWithRetries(this.mailService, {
        to: reqDto.email,
        subject: 'Welcome to NYP19VP',
        template: 'welcome.hbs',
        context: {
          name: reqDto.name,
          link: process?.env?.FE_URL || 'http://localhost:8080',
        },
      });

      await queryRunner.commitTransaction();
      return {
        statusCode: saveResult ? HttpStatus.CREATED : HttpStatus.BAD_REQUEST,
        message: saveResult
          ? 'create account successfully'
          : 'create account fail',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'create account fail',
        error: error.message,
      };
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }
  }

  async findOneBy(option): Promise<AccountEntity> {
    return this.accountRepo.findOneBy(option);
  }

  // It will create a new account, new social medial account too if not account_id found
  // It will return the access token and refresh token if the account is existed
  async socialSignup(user: SocialSignupReqDto): Promise<SocialSignupResDto> {
    // find the social account
    let socialAccount = await this.socialAccRepo.findOneBy({
      platform: user.platform,
      platformId: user.platformId,
    });

    let account: AccountEntity = null;
    if (socialAccount) {
      account = socialAccount.account;
    }
    if (!socialAccount) {
      const queryRunner = this.dataSource.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();
      AccountEntity;

      try {
        const roleUser = await this.roleRepo.findOneBy({
          roleName: ERole.user,
        });

        const password = 'password';
        const hashedPassword = await bcrypt.hash(password, 10);

        if (!account) {
          const createUserReq: CreateUserReqDto = {
            email: user.email,
            dob: undefined,
            name: user.name,
            phone: undefined,
            avatar: user.photo,
          };

          const createUserRes = await firstValueFrom(
            this.usersClient.send(
              kafkaTopic.USERS.CREATE,
              JSON.stringify(createUserReq),
            ),
          );

          if (createUserRes.error) {
            console.log('roll back');

            throw new Error(createUserRes.error);
          }

          account = this.accountRepo.create({
            username: randomUUID(),
            hashedPassword: hashedPassword,
            email: user.email,
            role: roleUser,
            userInfoId: createUserRes.data?.['_id'],
          });

          account = await queryRunner.manager.save<AccountEntity>(account);

          socialAccount = this.socialAccRepo.create({
            account: account,
            platform: user.platform,
            platformId: user.platformId,
          });
        } else {
          socialAccount = this.socialAccRepo.create({
            account: account,
            platform: user.platform,
            platformId: user.platformId,
          });
        }

        socialAccount = await queryRunner.manager.save<SocialAccountEntity>(
          socialAccount,
        );

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'create account fail',
          error: error.message,
        };
      } finally {
        // you need to release a queryRunner which was manually instantiated
        await queryRunner.release();
      }
    }

    if (!account || !socialAccount) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'SignUp failed',
      };
    }

    const payload: IJwtPayload = {
      user: {
        id: account.id,
        email: account.email,
        username: account?.username,
        role: account?.role?.roleName,
        userInfoId: account?.userInfoId,
        socialAccounts: (await account.socialAccounts).map((sa) => sa.platform),
      },
    };

    return {
      statusCode: HttpStatus.OK,
      message: 'SignUp successfully',
      data: {
        accessToken: this.authService.generateAccessJWT(payload),
        refreshToken: this.authService.generateRefreshJWT(payload),
      },
    };
  }

  /** Create user info
   * Return user info if success else throw error
   * @param reqDto
   * @returns
   */
  async createUserInfo(reqDto: CreateUserReqDto): Promise<BaseResDto> {
    const createUserInfoRes: BaseResDto = await firstValueFrom(
      this.usersClient
        .send(kafkaTopic.USERS.CREATE, JSON.stringify(reqDto))
        .pipe(timeout(toMs('10s'))),
    );

    console.log('createUserInfoRes', createUserInfoRes);

    if (
      !createUserInfoRes.statusCode.toString().startsWith('2') ||
      createUserInfoRes.error
    ) {
      throw new Error(createUserInfoRes.error || 'create user fail');
    }

    return createUserInfoRes;
  }

  async socialLink(reqDto: SocialLinkReqDto): Promise<SocialLinkResDto> {
    // check if the account is existed
    const account = await this.accountRepo.findOneBy({
      id: reqDto.accountId,
    });

    if (!account) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'link social account fail',
      };
    }

    // find all platform of the account that linked
    const socialAccounts = await account.socialAccounts;

    // check platform is existed
    if (
      socialAccounts.find(
        (socialAccount) => socialAccount.platform === reqDto.platform,
      )
    ) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'link social account fail',
      };
    }

    const isExist = await this.socialAccRepo.exist({
      where: {
        platform: reqDto.platform,
        platformId: reqDto.platformId,
      },
    });

    if (!isExist) {
      // link social account to account
      const socialAccount = this.socialAccRepo.create({
        account: account,
        platform: reqDto.platform,
        platformId: reqDto.platformId,
      });

      await this.socialAccRepo.save(socialAccount);
      const payload: IJwtPayload = {
        user: {
          id: account.id,
          email: account.email,
          username: account.username,
          role: account?.role?.roleName || undefined,
          userInfoId: account.userInfoId,
          socialAccounts: [
            ...new Set(
              (await account.socialAccounts).map(
                (socialAccount) => socialAccount.platform,
              ),
            ),
          ],
        },
      };
      return {
        statusCode: HttpStatus.CREATED,
        message: 'link social account successfully',
        data: {
          accessToken: this.authService.generateAccessJWT(payload),
          refreshToken: this.authService.generateRefreshJWT(payload),
        },
      };
    } else {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'link social account fail',
      };
    }
  }

  // async socialUnlink(reqDto: SocialUnlinkReqDto): Promise<SocialUnlinkResDto> {
  //   throw new RpcException('not implemented');
  // }

  async getUserInfoById(id: string): Promise<GetUserResDto> {
    try {
      const getUserInfoRes: GetUserResDto = await firstValueFrom(
        this.usersClient
          .send(kafkaTopic.USERS.GET_BY_ID, id)
          .pipe(timeout(toMs('10s'))),
      );

      return getUserInfoRes;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'get user info fail',
        error: error.message,
        user: null,
      };
    }
  }
  async getAllUserInfo(req): Promise<UserDto[]> {
    return await firstValueFrom(
      this.usersClient
        .send(kafkaTopic.USERS.GET_DELETED, req)
        .pipe(timeout(10000)),
    );
  }
}
