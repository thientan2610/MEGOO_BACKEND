import dotenv from 'dotenv';
import { Request } from 'express';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ENV_FILE } from '@nyp19vp-be/shared';

import { AuthService } from '../auth.service';
import { GOOGLE_STRATEGY_NAME } from '../constants/authentication';

dotenv.config({
  path: process.env.ENV_FILE ? process.env.ENV_FILE : ENV_FILE.DEV,
});

console.log({
  clientID: process.env.OAUTH2_GOOGLE_CLIENT_ID,
  clientSecret: process.env.OAUTH2_GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.OAUTH2_GOOGLE_CALLBACK_URL,
});

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  Strategy,
  GOOGLE_STRATEGY_NAME,
) {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.OAUTH2_GOOGLE_CLIENT_ID,
      clientSecret: process.env.OAUTH2_GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.OAUTH2_GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });

    console.log('[gg cf]', {
      clientID: process.env.OAUTH2_GOOGLE_CLIENT_ID,
      clientSecret: process.env.OAUTH2_GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.OAUTH2_GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  authenticate(req: any, options: any) {
    let state = `${req.params.from}`;

    if (req.params.accountId) {
      state = `${state};${req.params.accountId}`;
    }

    if (!options?.state) {
      options = {
        ...options,
        state,
      };
    }

    return super.authenticate(req, options);
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const googleUser = {
      provider: 'google',
      providerId: profile?.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      photo: profile.photos[0].value,
      accessToken,
      refreshToken,
    };

    done(null, googleUser);
  }
}
