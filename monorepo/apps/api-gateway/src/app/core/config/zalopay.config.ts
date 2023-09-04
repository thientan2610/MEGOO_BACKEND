import * as dotenv from 'dotenv';
import { ENV_FILE } from '@nyp19vp-be/shared';
dotenv.config({
  path: process.env.NODE_ENV !== 'dev' ? process.env.ENV_FILE : ENV_FILE.DEV,
});

export const zpconfig = {
  key2: process.env.ZALOPAY_KEY2,
};
