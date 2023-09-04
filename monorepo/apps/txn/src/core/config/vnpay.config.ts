import { ENV_FILE } from '@nyp19vp-be/shared';
import * as dotenv from 'dotenv';
dotenv.config({
  path: process.env.NODE_ENV !== 'dev' ? process.env.ENV_FILE : ENV_FILE.DEV,
});

export const vnpconfig = {
  app_id: process.env.VNPAY_APP_ID,
  key: process.env.VNPAY_KEY,
  create_order_endpoint: process.env.VNPAY_ENDPOINT,
  get_status_endpoint: process.env.VNPAY_API,
  callback_url: process.env.VNPAY_CALLBACK,
  timezone: process.env.TZ,
};
