import * as dotenv from 'dotenv';

import { IDbConfig } from './interfaces/dbConfig.interface';
import { ENV_FILE } from '@nyp19vp-be/shared';

dotenv.config({
  path: process.env.NODE_ENV !== 'dev' ? process.env.ENV_FILE : ENV_FILE.DEV,
});

export const dbCfg: IDbConfig = {
  host: process.env.DB_PROD_MGMT_HOST,
  port: process.env.DB_PROD_MGMT_PORT,
  username: process.env.DB_PROD_MGMT_USER,
  password: process.env.DB_PROD_MGMT_PASSWORD,
  database: process.env.DB_PROD_MGMT_DATABASE,
  synchronize: process.env.DB_PROD_MGMT_SYNCHRONIZE === 'true',
  logging: process.env.DB_PROD_MGMT_LOGGING === 'true',
};
