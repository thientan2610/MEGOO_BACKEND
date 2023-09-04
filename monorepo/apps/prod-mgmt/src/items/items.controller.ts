import {
  CreateItemReqDto,
  DeleteItemReqDto,
  GetItemByIdReqDto,
  GetItemsPaginatedReqDto,
  RestoreItemReqDto,
  UpdateItemReqDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/items';

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { kafkaTopic } from '@nyp19vp-be/shared';

import { ItemsService } from './items.service';

@Controller()
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @MessagePattern(kafkaTopic.PROD_MGMT.items.create)
  create(@Payload() reqDto: CreateItemReqDto) {
    console.log('#kafkaTopic.PROD_MGMT.items.create', reqDto);

    return this.itemsService.create(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.items.getById)
  getById(@Payload() reqDto: GetItemByIdReqDto) {
    console.log('#kafkaTopic.PROD_MGMT.items.getById', reqDto);

    return this.itemsService.getById(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.items.getPaginated)
  getPaginated(@Payload() reqDto: GetItemsPaginatedReqDto) {
    console.log('#kafkaTopic.PROD_MGMT.items.getPaginated', reqDto);

    return this.itemsService.getPaginated(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.items.update)
  update(@Payload() reqDto: UpdateItemReqDto) {
    console.log('#kafkaTopic.PROD_MGMT.items.update', reqDto);

    return this.itemsService.update(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.items.delete)
  delete(@Payload() reqDto: DeleteItemReqDto) {
    console.log('#kafkaTopic.PROD_MGMT.items.delete', reqDto);

    return this.itemsService.delete(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.items.restore)
  restore(@Payload() reqDto: RestoreItemReqDto) {
    console.log('#kafkaTopic.PROD_MGMT.items.restore', reqDto);

    return this.itemsService.restore(reqDto);
  }
}
