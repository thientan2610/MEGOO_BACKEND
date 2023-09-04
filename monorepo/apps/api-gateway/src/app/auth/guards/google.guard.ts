import { Request, Response } from 'express';

import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { GOOGLE_STRATEGY_NAME } from '../constants/authentication';

@Injectable()
export class GoogleAuthGuard extends AuthGuard(GOOGLE_STRATEGY_NAME) {
  constructor() {
    super({
      // accessType: 'offline',
      // response_type: "code",
      // display: 'popup',
      // approvalPrompt: 'auto',
      prompt: 'select_account', //"consent"
    });
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest() as Request;

    const res = (request.query.state as string)?.replace(/@/g, '/').split(';');
    const activate = (await super.canActivate(context)) as boolean;

    request.params.from = res[0];
    request.params.accountId = res[1];

    return activate;
  }
}
