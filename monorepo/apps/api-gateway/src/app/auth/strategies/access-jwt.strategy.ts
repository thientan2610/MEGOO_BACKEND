import { ExtractJwt, Strategy } from 'passport-jwt';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { ACCESS_JWT_STRATEGY_NAME } from '../constants/authentication';
import { BaseResDto, config } from '@nyp19vp-be/shared';

import { Request } from 'express';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { getAccessToken } from '../utils/get-jwt-token';

@Injectable()
export class AccessJwtStrategy extends PassportStrategy(
  Strategy,
  ACCESS_JWT_STRATEGY_NAME,
) {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const accessToken = getAccessToken(request);
          if (!accessToken) {
            throw new UnauthorizedException();
          }

          return accessToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.auth.strategies.strategyConfig.accessJwtSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request) {
    const at = getAccessToken(req);

    const resDto: BaseResDto = await this.authService.validateAccessToken(at);

    return resDto.data;
  }
}
