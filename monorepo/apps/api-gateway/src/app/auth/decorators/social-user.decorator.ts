import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ISocialUser } from '../interfaces/social-user.interface';

/**
 * return current logger account id as `string`, else `null`,
 * must implemented with Authentication
 */
export const SocialUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ISocialUser => {
    const request = ctx.switchToHttp().getRequest();

    return (request?.user as ISocialUser) ?? null;
  },
);
