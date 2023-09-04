import {
  itemsFilterableColumns,
  itemsSearchableColumns,
  itemsSortableColumns,
} from 'libs/shared/src/lib/config';
import { ProdMgmtItemDto } from 'libs/shared/src/lib/dto/prod-mgmt/dto/item.dto';
import {
  CreateItemReqDto,
  CreateItemResDto,
  DeleteItemResDto,
  GetItemByIdResDto,
  GetItemsPaginatedResDto,
  RestoreItemResDto,
  UpdateItemReqDto,
  UpdateItemResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/items';
import { Paginate, PaginateQuery } from 'nestjs-paginate';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PaginateQueryOptions } from '@nyp19vp-be/shared';

import { ItemsService } from './items.service';

@ApiTags('route: prod-mgmt', 'route: prod-mgmt/items')
@Controller('prod-mgmt/items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @ApiOperation({
    summary: 'Create item',
    description: 'Create item',
  })
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
    type: CreateItemResDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad request when create item.',
  })
  @Post()
  createItem(@Body() data: CreateItemReqDto) {
    return this.itemsService.createItem(data);
  }

  @ApiOperation({
    summary: 'Get item by id',
    description: 'Get item by id',
  })
  @ApiOkResponse({
    description: 'Get item by id',
    type: GetItemByIdResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when get item by id. Reason:
    - Invalid item id`,
  })
  @ApiNotFoundResponse({
    description: 'Item not found. Reason: The item id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when get item by id. Reason:
    - Timeout when connect to database
    - Timeout when connect to kafka microservice`,
  })
  @ApiParam({
    name: 'groupId',
    description: 'The group id',
    type: String,
    required: true,
  })
  @ApiParam({
    name: 'id',
    description: 'The item id',
    type: String,
    required: true,
  })
  @Get(':groupId/:id')
  getItemById(@Param('groupId') groupId: string, @Param('id') id: string) {
    return this.itemsService.getItemById(groupId, id);
  }

  @ApiOperation({
    summary: 'Get **PAGINATED** items',
    description: 'Get **PAGINATED** items',
  })
  @PaginateQueryOptions(
    ProdMgmtItemDto,
    itemsSearchableColumns,
    itemsSortableColumns,
    itemsFilterableColumns,
  )
  @ApiQuery({
    name: 'groupProductId',
    description:
      'The group product id, pass if you want list all items of a group product',
    type: String,
    required: false,
  })
  @Get(':groupId')
  getItems(
    @Param('groupId') groupId: string,
    @Query('groupProductId') groupProductId: string,
    @Paginate() query: PaginateQuery,
  ): Promise<GetItemsPaginatedResDto> {
    return this.itemsService.getItemsPaginated(groupId, groupProductId, query);
  }

  @ApiOperation({
    summary: 'Delete item by id',
    description: 'Delete item by id',
  })
  @ApiOkResponse({
    description: 'Delete item by id',
    type: DeleteItemResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when get item by id. Reason:
    - Invalid item id`,
  })
  @ApiNotFoundResponse({
    description: 'Item not found. Reason: The item id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when delete item by id. Reason:
    - Timeout when connect to database
    - Timeout when connect to kafka microservice`,
  })
  @ApiParam({
    name: 'groupId',
    description: 'The group id',
    type: String,
    required: true,
  })
  @ApiParam({
    name: 'id',
    description: 'The item id',
    type: String,
    required: true,
  })
  @Delete(':groupId/:id')
  deleteItem(@Param('groupId') groupId: string, @Param('id') id: string) {
    return this.itemsService.deleteItem(groupId, id);
  }

  @ApiOperation({
    summary: 'Restore item by id',
    description: 'Restore item by id',
  })
  @ApiOkResponse({
    description: 'Restore item by id',
    type: RestoreItemResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when get item by id. Reason:
    - Invalid item id`,
  })
  @ApiNotFoundResponse({
    description: 'Item not found. Reason: The item id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when restore item by id. Reason:
    - Timeout when connect to database
    - Timeout when connect to kafka microservice`,
  })
  @ApiParam({
    name: 'groupId',
    description: 'The group id',
    type: String,
    required: true,
  })
  @ApiParam({
    name: 'id',
    description: 'The item id',
    type: String,
    required: true,
  })
  @Patch(':groupId/:id')
  restoreItem(@Param('groupId') groupId: string, @Param('id') id: string) {
    return this.itemsService.restoreItem(groupId, id);
  }

  @ApiOperation({
    summary: 'Update item by id',
    description: 'Update item by id',
  })
  @ApiOkResponse({
    description: 'Update item by id',
    type: UpdateItemResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when get item by id. Reason:
    - Invalid item id
    - Group id does not exist`,
  })
  @ApiNotFoundResponse({
    description: 'Item not found. Reason: The item id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when update item by id. Reason:
    - Timeout when connect to database
    - Timeout when connect to kafka microservice`,
  })
  @ApiParam({
    name: 'groupId',
    description: 'The group id',
    type: String,
    required: true,
  })
  @ApiParam({
    name: 'id',
    description: 'The item id',
    type: String,
    required: true,
  })
  @Put(':groupId/:id')
  async updateItem(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @Body() reqDto: UpdateItemReqDto,
  ): Promise<UpdateItemResDto> {
    return this.itemsService.updateItem(groupId, id, reqDto);
  }
}
