import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AuthModule } from './app/auth.module';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'crypto';

import * as dotenv from 'dotenv';
import { ENV_FILE } from '@nyp19vp-be/shared';
dotenv.config({
  path: process.env.NODE_ENV !== 'dev' ? process.env.ENV_FILE : ENV_FILE.DEV,
});

console.log(
  '`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`',
  `${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`,
);

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
        },
        consumer: {
          groupId: 'auth-consumer',
        },
      },
    },
  );
  app.listen();
}
bootstrap();
