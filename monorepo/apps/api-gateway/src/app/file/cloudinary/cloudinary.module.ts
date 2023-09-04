import { Module } from '@nestjs/common';
import { CloudinaryModule } from 'nestjs-cloudinary';
import * as dotenv from 'dotenv';
import { ENV_FILE } from '@nyp19vp-be/shared';
dotenv.config({
  path: process.env.NODE_ENV !== 'dev' ? process.env.ENV_FILE : ENV_FILE.DEV,
});

console.log('cloudinary config', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

@Module({
  imports: [
    CloudinaryModule.forRootAsync({
      useFactory: () => ({
        isGlobal: true,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      }),
    }),
  ],
})
export class NestCloudinaryClientModule {}
