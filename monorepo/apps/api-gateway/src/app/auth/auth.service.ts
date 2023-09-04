import dotenv from 'dotenv';
import { Response } from 'express';
import { Auth, google } from 'googleapis';
import { resolve } from 'path';
import { catchError, firstValueFrom, timeout } from 'rxjs';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import {
  AuthorizeReqDto,
  AuthorizeResDto,
  CreateAccountReqDto,
  CreateAccountResDto,
  ELoginType,
  ENV_FILE,
  ERole,
  IUser,
  kafkaTopic,
  LoginReqDto,
  LoginResWithTokensDto,
  LogoutReqDto,
  LogoutResDto,
  RefreshTokenReqDto,
  RefreshTokenResDto,
  SocialLinkReqDto,
  SocialSignupReqDto,
  SocialSignupResDto,
  ValidateUserReqDto,
  ValidateUserResDto,
} from '@nyp19vp-be/shared';

import {
  ACCESS_JWT_COOKIE_NAME,
  ACCESS_JWT_DEFAULT_TTL,
  REFRESH_JWT_COOKIE_NAME,
  REFRESH_JWT_DEFAULT_TTL,
} from './constants/authentication';
import { ISocialUser } from './interfaces/social-user.interface';
import { toMs } from './utils/ms';

dotenv.config({
  path: process.env.ENV_FILE ? process.env.ENV_FILE : ENV_FILE.DEV,
});

@Injectable()
export class AuthService {
  oauthClient: Auth.OAuth2Client;
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientKafka,
  ) {
    const clientID = process.env.OAUTH2_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.OAUTH2_GOOGLE_CLIENT_SECRET;

    this.oauthClient = new google.auth.OAuth2(clientID, clientSecret);
  }

  /** Validate that have this Google Account been registered
   * If not do sign up
   * @param googleUser
   * @returns user
   */
  async googleSignUp(
    googleUser: ISocialUser,
    accountId: string,
  ): Promise<SocialSignupResDto> {
    const socialSignupReqDto: SocialSignupReqDto = {
      accountId: accountId,
      platform: googleUser.provider,
      platformId: googleUser.providerId,
      name: googleUser.name,
      email: googleUser.email,
      photo: googleUser.photo,
    };

    try {
      const resDto: SocialSignupResDto = await firstValueFrom(
        this.authClient
          .send(
            kafkaTopic.AUTH.SOCIAL_SIGN_UP,
            JSON.stringify(socialSignupReqDto),
          )
          .pipe(timeout(toMs('10s'))),
      );
      return resDto;
    } catch (error) {
      console.error('timeout', error);

      return null;
    }
  }

  /**
   * Validate a user by his/her username(email)/password. Return `IUser` if success else `null`
   * @param username username, email
   * @param password password
   * @param loginType enum value `username` or `email`
   * @returns `IUser` if sucess else `null`
   */
  async validateUser(
    username: string,
    password: string,
    loginType: ELoginType,
  ): Promise<IUser> {
    const validateUserReqDto: ValidateUserReqDto = {
      username,
      password,
      loginType,
    };

    const validateUserResDto: ValidateUserResDto = await firstValueFrom(
      this.authClient.send(
        kafkaTopic.AUTH.VALIDATE_USER,
        JSON.stringify(validateUserReqDto),
      ),
    );

    if (validateUserResDto.statusCode === HttpStatus.OK) {
      return validateUserResDto.user;
    } else {
      return null;
    }
  }

  async login(reqDto: LoginReqDto): Promise<LoginResWithTokensDto> {
    try {
      return await firstValueFrom(
        this.authClient
          .send(kafkaTopic.AUTH.LOGIN, JSON.stringify(reqDto))
          .pipe(timeout(toMs('10s'))),
      );
    } catch (error) {
      console.error('error', error);

      return error;
    }
  }

  async logout(reqDto: LogoutReqDto): Promise<LogoutResDto> {
    return firstValueFrom(
      this.authClient
        .send(kafkaTopic.AUTH.LOGOUT, JSON.stringify(reqDto))
        .pipe(timeout(toMs('10s'))),
    );
  }

  register(reqDto: CreateAccountReqDto): Promise<CreateAccountResDto> {
    return firstValueFrom(
      this.authClient.send(
        kafkaTopic.AUTH.CREATE_ACCOUNT,
        JSON.stringify(reqDto),
      ),
    );
  }

  setCookie(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(ACCESS_JWT_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: toMs(ACCESS_JWT_DEFAULT_TTL),
    });
    res.cookie(REFRESH_JWT_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: toMs(REFRESH_JWT_DEFAULT_TTL),
    });
  }

  async authorize(
    accessToken: string,
    requiredRoles: ERole[],
  ): Promise<boolean> {
    const authorizeReqDto: AuthorizeReqDto = {
      jwt: accessToken,
      roles: requiredRoles,
    };

    return true;

    const authorizeResult: AuthorizeResDto = await firstValueFrom(
      this.authClient.send(
        kafkaTopic.AUTH.AUTHORIZE,
        JSON.stringify(authorizeReqDto),
      ),
    );

    return authorizeResult.result;
  }

  async refresh(token: string): Promise<RefreshTokenResDto> {
    const reqDto: RefreshTokenReqDto = {
      refreshToken: token,
    };

    try {
      const resDto: RefreshTokenResDto = await firstValueFrom(
        this.authClient
          .send(kafkaTopic.AUTH.REFRESH, reqDto)
          .pipe(timeout(toMs('10s'))),
      );

      return resDto;
    } catch (error) {
      console.error('timeout', error);

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        error: error.message,
      };
    }
  }

  async linkGoogleAccount(userId: string, googleUser: ISocialUser) {
    const reqDto: SocialLinkReqDto = {
      accountId: userId,
      email: googleUser.email,
      platform: googleUser.provider,
      platformId: googleUser.providerId,
      name: googleUser.name,
      photo: googleUser.photo,
    };

    const resDto = await firstValueFrom(
      this.authClient
        .send(kafkaTopic.AUTH.SOCIAL_LINK, JSON.stringify(reqDto))
        .pipe(timeout(toMs('10s')))
        .pipe(
          catchError((error) => {
            throw error;
          }),
        ),
    );

    return resDto;
  }

  async getUserData(token: string) {
    const userInfoClient = google.oauth2('v2').userinfo;

    this.oauthClient.setCredentials({
      access_token: token,
    });

    const userInfoResponse = await userInfoClient.get({
      auth: this.oauthClient,
    });

    return userInfoResponse.data;
  }

  async validateAccessToken(token: string) {
    return firstValueFrom(
      this.authClient.send(kafkaTopic.AUTH.VALIDATE_TOKEN, token),
    );
  }

  async findAll(req) {
    const resDto = await firstValueFrom(
      this.authClient
        .send(kafkaTopic.AUTH.GET, req)
        .pipe(timeout(toMs('10s')))
        .pipe(
          catchError((error) => {
            throw error;
          }),
        ),
    );

    return resDto;
  }
}
