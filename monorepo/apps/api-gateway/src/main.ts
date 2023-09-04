import CookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app/app.module';
import {
  SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME,
  SWAGGER_BEARER_AUTH_REFRESH_TOKEN_NAME,
} from './app/constants/authentication';

// import { ExceptionFilter } from './app/filters/rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('NYP19VP API')
    .setDescription('NYP19VP API for goods management')
    .setVersion('1.0')
    .addServer('api')
    .addTag('Package Management')
    .addBearerAuth(
      {
        description: `Please enter access token in following format: Bearer <JWT>`,
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
        type: 'http',
        in: 'Header',
      },
      SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME,
    )
    .addBearerAuth(
      {
        description: `Please enter refresh token in following format: Bearer <JWT>`,
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
        type: 'http',
        in: 'Header',
      },
      SWAGGER_BEARER_AUTH_REFRESH_TOKEN_NAME,
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
    }),
  );

  app.use(CookieParser());

  app.enableCors({
    origin: [
      'http://localhost:3000', // be
      'http://localhost:3001', // be-backup

      'http://localhost:8000', // fe
      'http://localhost:8080', // admin-fe

      'https://megoo.netlify.app', // fe deploy
      'https://admin-megoo.netlify.app', // admin-fe deploy
    ],
    credentials: true,
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
