import * as dotenv from 'dotenv';
import { ENV_FILE } from '../../../core';

dotenv.config({
  path: process.env.ENV_FILE ? process.env.ENV_FILE : ENV_FILE.DEV,
});

export const strategyConfig = {
  accessJwtSecret: process.env.ACCESS_JWT_SECRET || 'access',
  accessJwtTtl: process.env.ACCESS_JWT_TLL || '1d',
  refreshJwtSecret: process.env.REFRESH_JWT_SECRET || 'refresh',
  refreshJwtTtl: process.env.REFRESH_JWT_TTL || '10d',
  joinGroupJwtSecret: process.env.JOIN_GR_JWT_DEFAULT_SECRET || 'join_gr',
  joinGroupJwtTtl: process.env.JOIN_GR_JWT_DEFAULT_TTL || '3d',
};
