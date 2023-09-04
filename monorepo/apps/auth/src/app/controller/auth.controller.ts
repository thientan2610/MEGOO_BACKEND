import { Controller, Get, Inject } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common/interfaces';
import { ClientKafka, MessagePattern, Payload } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import {
  BaseResDto,
  CreateAccountReqDto,
  CreateAccountResDto,
  kafkaTopic,
  LoginReqDto,
  LoginResDto,
  LoginResWithTokensDto,
  LogoutReqDto,
  LogoutResDto,
  PkgGrInvReqDto,
  RefreshTokenReqDto,
  RefreshTokenResDto,
  SocialLinkReqDto,
  SocialLinkResDto,
  SocialSignupReqDto,
  SocialSignupResDto,
  ValidateJoinGroupTokenReqDto,
  ValidateJoinGroupTokenResDto,
  ValidateUserReqDto,
  ValidateUserResDto,
} from '@nyp19vp-be/shared';

import { AccountService } from '../services/account.service';
import { ActionService } from '../services/action.service';
import { AuthService } from '../services/auth.service';
import { RefreshTokenBlacklistService } from '../services/refresh-token-blacklist.service';
import { RoleService } from '../services/role.service';

@ApiTags('auth')
@Controller()
export class AuthController implements OnModuleInit {
  constructor(
    private readonly authService: AuthService,
    private readonly accountService: AccountService,
    private readonly roleService: RoleService,
    private readonly actionService: ActionService,
    private readonly refreshTokenBlacklistService: RefreshTokenBlacklistService,
    @Inject('USERS_SERVICE') private readonly usersClient: ClientKafka,
    @Inject('PKG_MGMT_SERVICE') private readonly pkgMgmtClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // this.usersClient.subscribeToResponseOf(kafkaTopic.HEALT_CHECK.USERS);
    for (const key in kafkaTopic.USERS) {
      this.usersClient.subscribeToResponseOf(kafkaTopic.USERS[key]);
    }
    await Promise.all([this.usersClient.connect()]);

    this.pkgMgmtClient.subscribeToResponseOf(
      kafkaTopic.PKG_MGMT.GROUP.GET_BY_ID,
    );
  }

  @Get()
  getData() {
    return this.authService.getData();
  }

  @MessagePattern(kafkaTopic.AUTH.VALIDATE_USER)
  async validateUser(reqDto: ValidateUserReqDto): Promise<ValidateUserResDto> {
    return this.authService.validateUser(reqDto);
  }

  @MessagePattern(kafkaTopic.AUTH.VALIDATE_TOKEN)
  async validateToken(
    @Payload() token: string,
  ): Promise<LoginResWithTokensDto> {
    return this.authService.validateToken(token);
  }

  @MessagePattern(kafkaTopic.AUTH.LOGIN)
  async login(reqDto: LoginReqDto): Promise<LoginResDto> {
    console.log('MessagePattern(kafkaTopic.AUTH.LOGIN) ', reqDto);

    return this.authService.login(reqDto);
  }

  @MessagePattern(kafkaTopic.AUTH.LOGOUT)
  async logout(@Payload() reqDto: LogoutReqDto): Promise<LogoutResDto> {
    return this.authService.logout(reqDto.refreshToken);
  }

  @MessagePattern(kafkaTopic.AUTH.CREATE_ACCOUNT)
  async register(reqDto: CreateAccountReqDto): Promise<CreateAccountResDto> {
    console.log('MessagePattern(kafkaTopic.AUTH.CREATE_ACCOUNT) ', reqDto);

    return this.accountService.create(reqDto);
  }

  @MessagePattern(kafkaTopic.AUTH.SOCIAL_SIGN_UP)
  async socialSignup(reqDto: SocialSignupReqDto): Promise<SocialSignupResDto> {
    console.log('MessagePattern(kafkaTopic.AUTH.SOCIAL_SIGN_UP) ', reqDto);
    const resDto = await this.accountService.socialSignup(reqDto);

    return resDto;
  }

  @MessagePattern(kafkaTopic.AUTH.REFRESH)
  async refresh(
    @Payload() reqDto: RefreshTokenReqDto,
  ): Promise<RefreshTokenResDto> {
    return this.authService.refresh(reqDto.refreshToken);
  }

  @MessagePattern(kafkaTopic.AUTH.SOCIAL_LINK)
  async socialLink(
    @Payload() reqDto: SocialLinkReqDto,
  ): Promise<SocialLinkResDto> {
    console.log('MessagePattern(kafkaTopic.AUTH.SOCIAL_LINK) ', reqDto);

    return this.accountService.socialLink(reqDto);
  }

  @MessagePattern(kafkaTopic.AUTH.GENERATE_JOIN_GR_TOKEN)
  async genJoinGrToken(@Payload() reqDto: PkgGrInvReqDto): Promise<BaseResDto> {
    console.log(
      'MessagePattern(kafkaTopic.AUTH.GENERATE_JOIN_GR_TOKEN) ',
      reqDto,
    );

    return this.authService.genJoinGrToken(reqDto);
  }

  @MessagePattern(kafkaTopic.AUTH.VALIDATE_JOIN_GR_TOKEN)
  async validateJoinGrToken(
    @Payload() reqDto: ValidateJoinGroupTokenReqDto,
  ): Promise<ValidateJoinGroupTokenResDto> {
    return this.authService.validateJoinGrToken(reqDto);
  }

  @MessagePattern(kafkaTopic.AUTH.GET)
  async findAll(@Payload() req): Promise<BaseResDto> {
    return this.authService.findAll(req);
  }
}
