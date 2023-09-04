import { ACCESS_JWT_COOKIE_NAME } from './../constants/authentication/index';
import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';

function extractJwtFromHeader(req: Request): string | null {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader) {
    return null;
  }

  const [authType, token] = authorizationHeader.split(' ');
  if (authType !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

export const getAccessJwt = (req: Request) => {
  let jwt = req.cookies[ACCESS_JWT_COOKIE_NAME];

  if (!jwt) {
    jwt = extractJwtFromHeader(req);
  }

  if (!jwt) {
    throw new UnauthorizedException('token not provided');
  }

  return jwt;
};
