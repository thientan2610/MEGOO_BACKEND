import * as dotenv from 'dotenv';

import { IDbConfig } from './interfaces/dbConfig.interface';
import { ENV_FILE } from '@nyp19vp-be/shared';

dotenv.config({
  path: process.env.NODE_ENV !== 'dev' ? process.env.ENV_FILE : ENV_FILE.DEV,
});

export const dbCfg: IDbConfig = {
  host: process.env.DB_AUTH_HOST,
  port: process.env.DB_AUTH_PORT,
  username: process.env.DB_AUTH_USERNAME,
  password: process.env.DB_AUTH_PASSWORD,
  database: process.env.DB_AUTH_DATABASE,
  synchronize: process.env.DB_AUTH_SYNCHRONIZE === 'true',
  logging: process.env.DB_AUTH_LOGGING === 'true',
};
