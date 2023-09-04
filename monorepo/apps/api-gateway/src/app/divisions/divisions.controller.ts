import { Controller } from '@nestjs/common';
import { DivisionsService } from './divisions.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('divisions')
@Controller('divisions')
export class DivisionsController {
  constructor(private readonly divisionsService: DivisionsService) {}
}
