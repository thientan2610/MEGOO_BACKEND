import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ELoginType, IJwtPayload } from 'libs/shared/src/lib/core';
import { BaseResDto } from 'libs/shared/src/lib/dto/base.dto';
import { toMs } from 'libs/shared/src/lib/utils';
import moment from 'moment';
import { firstValueFrom, timeout } from 'rxjs';
import { Repository } from 'typeorm';

import { MailerService } from '@nestjs-modules/mailer';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common/enums';
import { JwtService } from '@nestjs/jwt';
import { ClientKafka, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import {
  config,
  ERole,
  GetGrResDto,
  GetUserResDto,
  kafkaTopic,
  LoginReqDto,
  LoginResWithTokensDto,
  LogoutResDto,
  PkgGrInvReqDto,
  ProjectionParams,
  RefreshTokenResDto,
  ValidateJoinGroupTokenReqDto,
  ValidateJoinGroupTokenResDto,
  ValidateUserReqDto,
  ValidateUserResDto,
} from '@nyp19vp-be/shared';

import { AccountEntity } from '../entities/account.entity';
import { RefreshTokenBlacklistEntity } from '../entities/refresh-token-blacklist.entity';
import { RoleEntity } from '../entities/role.entity';
import { TokenEntity } from '../entities/token.entity';
import { sendMailWithRetries } from '../utils/mail';
import { AccountService } from './account.service';
import ms from 'ms';

@Injectable()
export class AuthService {
  googleLogin(req) {
    if (!req.user) {
      return 'No user from google';
    }

    return {
      message: 'User information from google',
      user: req.user,
    };
  }
  constructor(
    @InjectRepository(AccountEntity)
    private accountRepo: Repository<AccountEntity>,
    @InjectRepository(AccountEntity)
    private roleRepo: Repository<RoleEntity>,
    private jwtService: JwtService,
    @InjectRepository(RefreshTokenBlacklistEntity)
    private refreshTokenBlacklistRepo: Repository<RefreshTokenBlacklistEntity>,

    @InjectRepository(TokenEntity)
    private tokenRepo: Repository<TokenEntity>,

    @Inject('USERS_SERVICE') private readonly usersClient: ClientKafka,
    @Inject('PKG_MGMT_SERVICE') private readonly pkgMgmtClient: ClientKafka,

    // service
    @Inject(forwardRef(() => AccountService))
    private readonly accountService: AccountService,

    private readonly mailerService: MailerService,
  ) {}
  getData(): { message: string } {
    return { message: 'Welcome to auth/Auth!' };
  }

  /**
   * Validate `username` and `password`, return `AccountEntity` object if validated
   * else throw and `RpcException`
   * @param username
   * @param password
   * @returns `IUser`
   */
  async validateUser({
    username,
    password,
  }: ValidateUserReqDto): Promise<ValidateUserResDto> {
    const accountFound: AccountEntity = await this.accountRepo.findOne({
      where: [
        {
          username: username,
        },
        {
          email: username,
        },
      ],
    });

    if (accountFound === null) {
      const userNotFoundRpcException: LoginResWithTokensDto = {
        statusCode: HttpStatus.NOT_FOUND,
        message: `user with user name ${username} not found`,
      };
      throw new RpcException(userNotFoundRpcException);
    }

    const isPwdMatched = await bcrypt.compare(
      password,
      accountFound.hashedPassword,
    );

    console.debug(`isPwdMatched = `, isPwdMatched);

    if (!isPwdMatched) {
      const userNotFoundRpcException: LoginResWithTokensDto = {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: `password is not matched`,
      };
      throw new RpcException(userNotFoundRpcException);
    }

    const socialAccounts = await accountFound.socialAccounts;

    return {
      statusCode: HttpStatus.OK,
      message: `user ${username} validated`,
      user: {
        id: accountFound.id,
        username: accountFound.username,
        email: accountFound.email,
        role: accountFound.role.roleName,
        userInfoId: accountFound.userInfoId,
        password: undefined,
        hashedPassword: undefined,
        socialAccounts: socialAccounts.map((sa) => sa.platform),
      },
    };
  }

  async validateToken(token: string): Promise<LoginResWithTokensDto> {
    const decodeRes = this.jwtService.decode(token);
    const payload: IJwtPayload = decodeRes as IJwtPayload;

    const account = await this.accountRepo.findOneBy({
      id: payload.user.id,
    });

    if (!account) {
      const accountNotFountRpcException: LoginResWithTokensDto = {
        statusCode: 401,
        message: `account not found`,
      };
    }

    // update payload with latest info
    /**
     * "id": "user1",
      "username": "user1",
      "email": "user1@gmail.com",
      "role": "user",
      "userInfoId": "64a088917a6c92c74d764dfb",
      "socialAccounts": []
     */
    const user = {
      id: account.id,
      username: account.username,
      email: account.email,
      role: account.role.roleName,
      userInfoId: account.userInfoId,
      socialAccounts: (await account.socialAccounts).map((sa) => sa.platform),
    };

    return {
      statusCode: HttpStatus.OK,
      message: 'Login successfully',
      data: {
        auth: {
          user: user,
        },
        userInfo: (
          await this.accountService.getUserInfoById(payload.user.userInfoId)
        ).user,
      },
    };
  }

  decodeToken(token: string): IJwtPayload {
    const decodeResult = this.jwtService.decode(token);

    const jwtPayload: IJwtPayload = {
      ...(decodeResult as IJwtPayload),
    };

    if (
      !jwtPayload.user ||
      !jwtPayload.user.username ||
      !jwtPayload.user.role ||
      ![ERole.admin, ERole.user].includes(jwtPayload.user.role) ||
      !jwtPayload.iat ||
      !jwtPayload.exp
    ) {
      const rpcExc: BaseResDto = {
        message: 'Jwt payload error',
        statusCode: HttpStatus.UNAUTHORIZED,
      };

      throw new RpcException(rpcExc);
    }

    return jwtPayload;
  }

  async login(userDto: LoginReqDto): Promise<LoginResWithTokensDto> {
    const validateUserRes: ValidateUserResDto = await this.validateUser({
      username: userDto.username,
      password: userDto.password,
      loginType: ELoginType.email,
    });

    const accessToken = this.generateAccessJWT({
      user: validateUserRes.user,
    });
    const refreshToken = this.generateRefreshJWT({
      user: validateUserRes.user,
    });

    return Promise.resolve({
      statusCode: HttpStatus.OK,
      message: 'Login successfully',
      accessToken: accessToken,
      refreshToken: refreshToken,
      data: {
        auth: validateUserRes.user,
        userInfo: (
          await this.accountService.getUserInfoById(
            validateUserRes.user.userInfoId,
          )
        ).user,
      },
    });
  }

  /**
   * Add refreshToken to blacklist, remove cookie
   * @param refreshToken String
   * @returns boolean
   */
  async logout(refreshToken: string): Promise<LogoutResDto> {
    try {
      const decoded = this.decodeToken(refreshToken);

      const account = await this.accountRepo.findOneBy({
        username: decoded.user.username,
      });

      if (!account) {
        const accountNotFountRpcException: LogoutResDto = {
          statusCode: 401,
          message: `account not found`,
        };

        throw new RpcException(accountNotFountRpcException);
      }

      // hash refreshToken with sha256
      const hash = crypto.createHash('sha256');
      hash.update(refreshToken);

      const refreshTokenRecord = this.refreshTokenBlacklistRepo.create({
        account: account,
        userId: account.id,
        token: hash.digest('hex'),
        expiredAt: new Date(decoded.exp * 1e3),
      });

      await this.refreshTokenBlacklistRepo.save(refreshTokenRecord);

      return {
        statusCode: HttpStatus.OK,
        message: 'Logout successfully',
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  /**
   * return true if token is valid, false if token is in blacklist
   */
  async validateRefreshToken(refreshToken: string): Promise<boolean> {
    // hash refreshToken with sha256
    const hash = crypto.createHash('sha256');
    hash.update(refreshToken);
    const hashedToken = hash.digest('hex');

    return !(await this.refreshTokenBlacklistRepo.exist({
      where: {
        token: hashedToken,
      },
    }));
  }

  refreshAccessToken(payload: IJwtPayload): string {
    const accessToken = this.generateAccessJWT(payload);

    return accessToken;
  }

  generateAccessJWT(payload: IJwtPayload): string {
    delete payload.exp;
    delete payload.iat;
    return this.jwtService.sign(payload, {
      expiresIn: config.auth.strategies.strategyConfig.accessJwtTtl, // 10 mins
      secret: config.auth.strategies.strategyConfig.accessJwtSecret,
    });
  }

  generateRefreshJWT(payload: IJwtPayload): string {
    delete payload.exp;
    delete payload.iat;
    return this.jwtService.sign(payload, {
      expiresIn: config.auth.strategies.strategyConfig.refreshJwtTtl, // 10 days
      secret: config.auth.strategies.strategyConfig.refreshJwtSecret,
    });
  }

  async refresh(refreshToken: string): Promise<RefreshTokenResDto> {
    if (await this.validateRefreshToken(refreshToken)) {
      const jwtPayload: IJwtPayload = this.decodeToken(refreshToken);

      const accessToken = this.generateAccessJWT(jwtPayload);

      return {
        statusCode: HttpStatus.OK,
        message: 'Refresh token successfully',
        accessToken: accessToken,
      };
    } else {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Refresh token fail cause user has been logout',
      };
    }
  }

  async genJoinGrToken(reqDto: PkgGrInvReqDto): Promise<BaseResDto> {
    const tokenList = reqDto.emails.map((email) => {
      const payload: PkgGrInvReqDto = {
        ...reqDto,
        emails: [email],
      };

      return this.jwtService.sign(payload, {
        expiresIn: config.auth.strategies.strategyConfig.joinGroupJwtTtl,
        secret: config.auth.strategies.strategyConfig.joinGroupJwtSecret,
      });
    });

    console.log('tokenList', tokenList);

    const hashTokenList = tokenList.map((token) => {
      return crypto.createHash('sha256').update(token, 'utf-8').digest('hex');
    });

    let tokenInsList = hashTokenList.map((hashToken) => {
      return this.tokenRepo.create({
        leftTime: 1,
        hashToken: hashToken,
        expiredAt: moment()
          .add(
            toMs(config.auth.strategies.strategyConfig.joinGroupJwtTtl),
            'ms',
          )
          .toDate(),
      });
    });

    try {
      tokenInsList = await this.tokenRepo.save(tokenInsList);
    } catch (error) {
      console.error('error', error);

      throw new RpcException(error);
    }

    // retrieve inviter info
    let userInfoResDto: GetUserResDto = null;
    try {
      userInfoResDto = await firstValueFrom(
        this.usersClient
          .send(kafkaTopic.USERS.GET_BY_ID, reqDto.addedBy)
          .pipe(timeout(toMs('10s'))),
      );
    } catch (error) {
      console.error('error', error);

      throw new RpcException(error);
    }

    // retrieve group info
    let grResDto: GetGrResDto = null;
    try {
      const projectParams: ProjectionParams = {
        _id: reqDto.grId,
        proj: {},
      };
      grResDto = await firstValueFrom(
        this.pkgMgmtClient
          .send(
            kafkaTopic.PKG_MGMT.GROUP.GET_BY_ID,
            JSON.stringify(projectParams),
          )
          .pipe(timeout(toMs('10s'))),
      );
    } catch (error) {
      console.error('error', error);

      throw new RpcException(error);
    }

    // for each email, send email with token
    const res: (false | unknown)[] = await Promise.all([
      reqDto.emails.map(async (email, index) => {
        const tokenIns = tokenInsList[index];
        const url = `${reqDto.feUrl}?token=${tokenList[index]}`;

        await sendMailWithRetries(this.mailerService, {
          to: email,
          subject: 'Lời mời tham gia nhóm',
          template: 'invite-to-gr_vi.hbs',
          context: {
            inviterName: userInfoResDto?.user?.name,
            groupName: grResDto?.group?.name,
            url: url,
            code: tokenIns.id,
            expiredTime: ms(
              ms(config.auth.strategies.strategyConfig.joinGroupJwtTtl),
              {
                long: true,
              },
            ).replace('days', 'ngày'),
          },
        });
      }),
    ]);

    const emailsFailed = res.map((item, idx) => {
      return item === false ? reqDto.emails[idx] : null;
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Generate join group token successfully',
      data: {
        emailsFailed: emailsFailed.filter((item) => item !== null),
      },
    };
  }

  async validateJoinGrToken(
    reqDto: ValidateJoinGroupTokenReqDto,
  ): Promise<ValidateJoinGroupTokenResDto> {
    const result = this.jwtService.verify(reqDto.token, {
      secret: config.auth.strategies.strategyConfig.joinGroupJwtSecret,
    });

    console.log('verify result', result);

    const tokenIns = await this.tokenRepo.findOne({
      where: {
        hashToken: crypto
          .createHash('sha256')
          .update(reqDto.token)
          .digest('hex'),
      },
    });

    if (!tokenIns) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Token not found',
      });
    } else {
      if (tokenIns.leftTime <= 0) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Token expired',
        });
      }
      // delete token if 1 time left
      else if (tokenIns.leftTime === 1) {
        await this.tokenRepo.delete(tokenIns.id);
      } else {
        // update token
        tokenIns.leftTime -= 1;
        await this.tokenRepo.save(tokenIns);
      }
    }

    return result;
  }

  async findAll(req): Promise<BaseResDto> {
    try {
      const listAcc = await this.accountRepo.find();
      const listUser = await this.accountService.getAllUserInfo(req);
      const res = listAcc.map((account) => {
        const found = listUser.find((ele) => ele._id === account.userInfoId);
        account['userInfo'] = found;
        return account;
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Get all users successfully',
        data: res,
      };
    } catch (error) {
      console.error('error', error);

      throw new RpcException(error);
    }
  }
}
