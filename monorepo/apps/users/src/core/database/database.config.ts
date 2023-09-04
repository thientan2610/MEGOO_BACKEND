import * as dotenv from 'dotenv';

import { ENV_FILE } from '@nyp19vp-be/shared';

import { IDbConfig } from './interfaces/dbConfig.interface';

dotenv.config({
  path: process.env.NODE_ENV !== 'dev' ? process.env.ENV_FILE : ENV_FILE.DEV,
});

export const dbCfg: IDbConfig = {
  host: process.env.DB_USERS_HOST,
  port: process.env.DB_USERS_PORT,
  username: process.env.DB_USERS_USER,
  password: process.env.DB_USERS_PASSWORD,
  database: process.env.DB_USERS_DATABASE,
};

console.log('dbCfg', dbCfg);

export const getMongoConnectionString = (dbCfg: IDbConfig) => {
  console.log(`process.env.NODE_ENV ${process.env.NODE_ENV}`);

  if (process.env.NODE_ENV === 'dev') {
    const connectionStr = `mongodb://${dbCfg.username}:${dbCfg.password}@${dbCfg.host}:${dbCfg.port}/${dbCfg.database}?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.8.0`;
    console.log('connection string', connectionStr);
    return connectionStr;
  } else {
    const connectionStr = `mongodb+srv://${dbCfg.username}:${dbCfg.password}@${dbCfg.host}/${dbCfg.database}?retryWrites=true&w=majority`;
    console.log('connection string', connectionStr);

    return connectionStr;
  }
};
