export const ACCESS_JWT_COOKIE_NAME = 'access_token';
export const REFRESH_JWT_COOKIE_NAME = 'refresh_token';

export const LOCAL_STRATEGY_NAME = 'local';

export const ACCESS_JWT_STRATEGY_NAME = 'access_jwt';
export const ACCESS_JWT_DEFAULT_SECRET =
  process.env.ACCESS_JWT_SECRET || 'access';
export const ACCESS_JWT_DEFAULT_TTL = process.env.ACCESS_JWT_TLL || '1d';

export const REFRESH_JWT_STRATEGY_NAME = 'refresh_jwt';
export const REFRESH_JWT_DEFAULT_SECRET =
  process.env.REFRESH_JWT_SECRET || 'refresh';
export const REFRESH_JWT_DEFAULT_TTL = process.env.REFRESH_JWT_TTL || '1d';

export const JWT_TOKEN_ERRORS = {
  TOKEN_EXPIRED_ERROR: 'TokenExpiredError',
  NOT_BEFORE_ERROR: 'NotBeforeError',
  JWT_ERROR: 'JsonWebTokenError',
};

export const GOOGLE_STRATEGY_NAME = 'google';
