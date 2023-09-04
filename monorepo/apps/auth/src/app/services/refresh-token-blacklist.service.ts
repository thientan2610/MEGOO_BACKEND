import { Injectable } from '@nestjs/common';

@Injectable()
export class RefreshTokenBlacklistService {
  getData(): { message: string } {
    return { message: 'Welcome to auth/RefreshTokenBlacklist!' };
  }
}
