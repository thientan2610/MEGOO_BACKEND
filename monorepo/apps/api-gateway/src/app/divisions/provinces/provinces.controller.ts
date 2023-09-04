import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProvincesService } from './provinces.service';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('divisions')
@Controller('p')
export class ProvincesController {
  constructor(private readonly provincesService: ProvincesService) {}

  @ApiQuery({
    name: 'q',
    required: false,
    description:
      'Search by name of the province, pass `%` or let empty to get all provinces',
  })
  @Get()
  search(@Query('q') q: string) {
    return this.provincesService.search(q || '%');
  }

  @ApiParam({
    name: 'code',
    required: true,
    type: 'number',
    description: 'Province code',
  })
  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.provincesService.findByCode(+code);
  }
}
