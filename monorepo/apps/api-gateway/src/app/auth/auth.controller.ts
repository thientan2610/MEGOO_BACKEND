import { Request, Response } from 'express';
import { google } from 'googleapis';
import { Profile } from 'passport-google-oauth20';

import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpException,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { HttpStatus } from '@nestjs/common/enums';
import { ClientKafka } from '@nestjs/microservices';
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateAccountReqDto,
  CreateAccountResDto,
  ERole,
  GoogleLinkReqDto,
  GoogleSignUpReqDto,
  kafkaTopic,
  LoginReqDto,
  LoginResDto,
  LoginResWithTokensDto,
  LogoutReqDto,
  LogoutResDto,
  SocialSignupResDto,
  UserDto,
} from '@nyp19vp-be/shared';

import { SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME } from '../constants/authentication';
import { SWAGGER_BEARER_AUTH_REFRESH_TOKEN_NAME } from '../constants/authentication/index';
// import { AllGlobalExceptionsFilter } from '../filters/filter';
import { AuthService } from './auth.service';
import { SocialUser } from './decorators/social-user.decorator';
import { SocialAccountReqDto } from './dto/social-account.req.dto';
import { GoogleAuthGuard } from './guards/google.guard';
import { AccessJwtAuthGuard, RefreshJwtAuthGuard } from './guards/jwt.guard';
import { ISocialUser } from './interfaces/social-user.interface';
import { getRefreshToken } from './utils/get-jwt-token';

@ApiTags('auth')
@Controller('auth')
export class AuthController implements OnModuleInit {
  constructor(
    private readonly authService: AuthService,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // this.authClient.subscribeToResponseOf(kafkaTopic.HEALT_CHECK.AUTH);

    for (const key in kafkaTopic.AUTH) {
      this.authClient.subscribeToResponseOf(kafkaTopic.AUTH[key]);
    }

    await Promise.all([this.authClient.connect()]);
  }

  @Get('oauth2/google/:from')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // this route empty
  }

  @Get('oauth2/google/:from/:accountId')
  @UseGuards(GoogleAuthGuard)
  async googleAuthLink() {
    // this route empty
  }

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(
    @Req() req: Request,
    @Res() res: Response,
    @SocialUser() googleUser: ISocialUser,
  ) {
    if (!googleUser) {
      throw new UnauthorizedException();
    }

    const webUrl =
      req.params.from || process.env.WEB_URL || 'http://localhost:8080';

    const accountId = req.params.accountId || undefined;

    if (!accountId) {
      const resDto: SocialSignupResDto = await this.authService.googleSignUp(
        googleUser,
        accountId,
      );

      if (resDto.statusCode === HttpStatus.OK) {
        this.authService.setCookie(
          res,
          resDto?.data?.accessToken,
          resDto?.data?.refreshToken,
        );
      }
      res.redirect(
        `${webUrl}` +
          `?accessToken=${resDto?.data?.accessToken}` +
          `?message=${resDto.message}` +
          `?statusCode=${resDto?.statusCode}` +
          `?errCode=${resDto?.errCode}`,
      );
    } else {
      const resDto = await this.authService.linkGoogleAccount(
        accountId,
        googleUser,
      );

      if (resDto.statusCode === HttpStatus.CREATED) {
        this.authService.setCookie(
          res,
          resDto?.data?.accessToken,
          resDto?.data?.refreshToken,
        );
      }

      res.redirect(
        `${webUrl}` +
          `?accessToken=${resDto?.data?.accessToken}` +
          `?message=${resDto.message}` +
          `?statusCode=${resDto?.statusCode}` +
          `?errCode=${resDto?.errCode}`,
      );
    }
  }

  @Post('mobile/google-sign-up')
  async googleSignUpMobile(
    @Res() res: Response,
    @Body() googleSignUpReqDto: GoogleSignUpReqDto,
  ): Promise<SocialSignupResDto> {
    const token = googleSignUpReqDto.googleAccessToken;

    if (token) {
      try {
        const profile: any = await this.authService.getUserData(token);

        const reqDto: SocialAccountReqDto = {
          provider: 'google',
          providerId: profile?.id,
          name: profile?.name,
          email: profile?.email,
          photo: profile?.picture,
        };

        const resDto = await this.authService.googleSignUp(reqDto, null);

        if (!resDto) {
          throw new HttpException(
            'Cannot create social account',
            HttpStatus.BAD_REQUEST,
          );
        }

        this.authService.setCookie(
          res,
          resDto.data.accessToken,
          resDto.data.refreshToken,
        );

        res.status(resDto.statusCode).json(resDto);
        return resDto;
      } catch (error) {
        throw new UnauthorizedException();
      }
    }
    throw new UnauthorizedException();
  }

  @Post('mobile/google-link')
  async googleLinkMobile(
    @Body() googleSignUpReqDto: GoogleLinkReqDto,
  ): Promise<SocialSignupResDto> {
    const token = googleSignUpReqDto.googleAccessToken;
    const accountId = googleSignUpReqDto.accountId;
    if (token) {
      try {
        const profile: any = await this.authService.getUserData(token);

        const reqDto: SocialAccountReqDto = {
          provider: 'google',
          providerId: profile?.id,
          name: profile?.name,
          email: profile?.email,
          photo: profile?.picture,
        };

        const resDto = await this.authService.linkGoogleAccount(accountId, {
          email: reqDto.email,
          name: reqDto.name,
          photo: reqDto.photo,
          provider: reqDto.provider,
          providerId: reqDto.providerId,
        });

        if (!resDto) {
          throw new HttpException(
            'Cannot create social account',
            HttpStatus.BAD_REQUEST,
          );
        }
        return resDto;
      } catch (error) {
        throw new UnauthorizedException();
      }
    }
    throw new UnauthorizedException();
  }

  @ApiResponse({
    description: 'response of login',
    type: LogoutResDto,
  })
  @Post('login')
  async login(
    @Body() reqDto: LoginReqDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const loginResWithTokensDto: LoginResWithTokensDto =
      await this.authService.login(reqDto);

    this.authService.setCookie(
      res,
      loginResWithTokensDto.accessToken,
      loginResWithTokensDto.refreshToken,
    );

    const loginResDto: LoginResDto = {
      statusCode: loginResWithTokensDto.statusCode,
      message: loginResWithTokensDto.message,
      accessToken: loginResWithTokensDto.accessToken,
      data: loginResWithTokensDto.data,
    };

    if (loginResDto.statusCode !== HttpStatus.OK) {
      throw new HttpException(loginResDto, loginResDto.statusCode);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.json(loginResDto);
      res.end();
    }
  }

  @ApiResponse({
    description: 'response of login',
    type: LogoutResDto,
  })
  @Post('login/mobile')
  async loginMobile(
    @Body() reqDto: LoginReqDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const loginResWithTokensDto: LoginResWithTokensDto =
      await this.authService.login(reqDto);

    this.authService.setCookie(
      res,
      loginResWithTokensDto.accessToken,
      loginResWithTokensDto.refreshToken,
    );

    const loginResDto: LoginResWithTokensDto = {
      statusCode: loginResWithTokensDto.statusCode,
      message: loginResWithTokensDto.message,
      accessToken: loginResWithTokensDto.accessToken,
      refreshToken: loginResWithTokensDto.refreshToken,
      data: loginResWithTokensDto.data,
    };

    if (loginResDto.statusCode !== HttpStatus.OK) {
      throw new HttpException(loginResDto, loginResDto.statusCode);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.json(loginResDto);
      res.end();
    }
  }

  @Post('logout')
  @ApiBearerAuth(SWAGGER_BEARER_AUTH_REFRESH_TOKEN_NAME)
  @UseGuards(RefreshJwtAuthGuard)
  async logout(@Req() req: Request): Promise<LogoutResDto> {
    const refreshToken = getRefreshToken(req) || undefined;

    return this.authService.logout({
      refreshToken,
    });
  }

  @Post('register')
  register(@Body() reqDto: CreateAccountReqDto): Promise<CreateAccountResDto> {
    return this.authService.register({
      ...reqDto,
      roleName: ERole.user,
    });
  }

  @Post('register-admin')
  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  registerADmin(
    @Req() req: Request,
    @Body() reqDto: CreateAccountReqDto,
  ): Promise<CreateAccountResDto> {
    // check if user is admin
    console.log(req.user);

    //todo: check if user is admin
    if (req?.user?.['auth']?.['user']?.['role'] !== 'admin') {
      throw new ForbiddenException();
    }

    return this.authService.register({
      ...reqDto,
      roleName: ERole.admin,
    });
  }

  @Get('validate')
  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  validate(@Req() req: Request) {
    return req.user;
  }

  @Get('refresh')
  @ApiBearerAuth(SWAGGER_BEARER_AUTH_REFRESH_TOKEN_NAME)
  @UseGuards(RefreshJwtAuthGuard)
  async refresh(@Req() req: Request) {
    const refreshToken = getRefreshToken(req) || '';

    return this.authService.refresh(refreshToken);
  }

  @Get('oauth2/google/:from/:userId')
  @UseGuards(GoogleAuthGuard)
  async googleLink() {
    // this route empty
  }

  @Get()
  async findAll(@Req() req: Request) {
    return this.authService.findAll(req);
  }
}
