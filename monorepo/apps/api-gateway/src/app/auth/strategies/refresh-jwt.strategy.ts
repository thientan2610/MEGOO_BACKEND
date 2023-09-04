import * as dotenv from 'dotenv';
import { Request } from 'express';
import { ENV_FILE } from 'libs/shared/src/lib/core/constants';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { forwardRef, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { config } from '@nyp19vp-be/shared';

import {
  REFRESH_JWT_COOKIE_NAME,
  REFRESH_JWT_STRATEGY_NAME,
} from '../constants/authentication';
import { AuthService } from '../auth.service';
import { getRefreshToken } from '../utils/get-jwt-token';

dotenv.config({
  path: process.env.ENV_FILE ? process.env.ENV_FILE : ENV_FILE.DEV,
});

export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  REFRESH_JWT_STRATEGY_NAME,
) {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const refreshToken = getRefreshToken(request);
          if (!refreshToken) {
            throw new UnauthorizedException();
          }

          return refreshToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.auth.strategies.strategyConfig.refreshJwtSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    // const refreshToken = req.cookies[REFRESH_JWT_COOKIE_NAME];

    // console.log(refreshToken);

    // this.authService.de

    // const isTokenValid = await this.authService.validateRefreshToken(
    //   decoded.username,
    //   refreshToken,
    // );
    // if (!isTokenValid) {
    //   console.log('token is in blacklist');

    //   throw new HttpException(
    //     {
    //       statusCode: 401,
    //       message: 'The refresh token is in blacklist',
    //     },
    //     HttpStatus.UNAUTHORIZED,
    //   );
    // }

    return payload;
  }
}
