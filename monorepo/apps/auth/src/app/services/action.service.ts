import { Injectable } from '@nestjs/common';

@Injectable()
export class ActionService {
  getData(): { message: string } {
    return { message: 'Welcome to auth/Action!' };
  }
}
