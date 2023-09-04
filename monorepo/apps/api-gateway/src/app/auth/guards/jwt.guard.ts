import * as dotenv from 'dotenv';
import { ENV_FILE } from 'libs/shared/src/lib/core/constants';

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import {
  ACCESS_JWT_STRATEGY_NAME,
  REFRESH_JWT_STRATEGY_NAME,
} from '../constants/authentication';

dotenv.config({
  path: process.env.ENV_FILE ? process.env.ENV_FILE : ENV_FILE.DEV,
});

@Injectable()
export class AccessJwtAuthGuard extends AuthGuard(ACCESS_JWT_STRATEGY_NAME) {}

@Injectable()
export class RefreshJwtAuthGuard extends AuthGuard(REFRESH_JWT_STRATEGY_NAME) {}
