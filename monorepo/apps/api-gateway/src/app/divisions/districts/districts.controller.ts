import { Controller, Get, Param, Query } from '@nestjs/common';
import { DistrictsService } from './districts.service';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('divisions')
@Controller('d')
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) {}

  @ApiQuery({
    name: 'q',
    required: false,
    description:
      'Search by name of the province, pass `%` or let `empty` to get all districts',
  })
  @ApiQuery({
    name: 'p',
    required: true,
    type: 'number',
    description: 'Search districts by province code',
  })
  @Get()
  search(@Query('q') q: string, @Query('p') p: string) {
    return this.districtsService.search(q || '%', p);
  }

  @ApiParam({
    name: 'code',
    required: true,
    type: 'number',
    description: 'District code',
  })
  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.districtsService.findByCode(+code);
  }
}
