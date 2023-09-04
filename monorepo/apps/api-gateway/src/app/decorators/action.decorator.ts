import { SetMetadata } from '@nestjs/common';

export const Action = (actionId: string) => SetMetadata('action', actionId);
