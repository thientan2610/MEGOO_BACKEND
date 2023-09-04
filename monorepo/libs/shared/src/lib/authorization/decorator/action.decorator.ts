import { SetMetadata } from '@nestjs/common';

export const ACTION_KEY = 'action';
export const Roles = (action: string) => SetMetadata(ACTION_KEY, action);
