import {
  CreateNewGroupProductReqDto,
  CreateNewGroupProductResDto,
  DeleteNewGroupProductReqDto,
  DeleteNewGroupProductResDto,
  GetNewGroupProductByIdReqDto,
  GetNewGroupProductByIdResDto,
  GetNewGroupProductsPaginatedReqDto,
  RestoreNewGroupProductReqDto,
  RestoreNewGroupProductResDto,
  UpdateNewGroupProductReqDto,
  UpdateNewGroupProductResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/new-group-products';

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { kafkaTopic } from '@nyp19vp-be/shared';

import { NewGroupsProductsService } from './new-groups-products.service';

@Controller()
export class GroupsProductsController {
  constructor(
    private readonly groupsProductsService: NewGroupsProductsService,
  ) {}

  @MessagePattern(kafkaTopic.PROD_MGMT.newGroupProducts.create)
  async createNewGroupProduct(
    @Payload() reqDto: CreateNewGroupProductReqDto,
  ): Promise<CreateNewGroupProductResDto> {
    console.log('#kafkaTopic.PROD_MGMT.newGroupProducts.create', reqDto);

    return this.groupsProductsService.createNewGroupProduct(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.newGroupProducts.getById)
  async getNewGroupProductById(
    @Payload() reqDto: GetNewGroupProductByIdReqDto,
  ): Promise<GetNewGroupProductByIdResDto> {
    console.log('#kafkaTopic.PROD_MGMT.newGroupProducts.getById', reqDto);

    return this.groupsProductsService.getNewGroupProductById(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.newGroupProducts.getPaginated)
  async getNewGroupProductsPaginated(
    @Payload() reqDto: GetNewGroupProductsPaginatedReqDto,
  ) {
    console.log('#kafkaTopic.PROD_MGMT.newGroupProducts.getPaginated', reqDto);

    return this.groupsProductsService.getNewGroupProductsPaginated(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.newGroupProducts.delete)
  async deleteNewGroupProduct(
    @Payload() reqDto: DeleteNewGroupProductReqDto,
  ): Promise<DeleteNewGroupProductResDto> {
    console.log('#kafkaTopic.PROD_MGMT.newGroupProducts.delete', reqDto);

    return this.groupsProductsService.deleteNewGroupProduct(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.newGroupProducts.restore)
  async restoreNewGroupProduct(
    @Payload() reqDto: RestoreNewGroupProductReqDto,
  ): Promise<RestoreNewGroupProductResDto> {
    console.log('#kafkaTopic.PROD_MGMT.newGroupProducts.restore', reqDto);

    return this.groupsProductsService.restoreNewGroupProduct(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.newGroupProducts.update)
  async updateNewGroupProduct(
    @Payload() reqDto: UpdateNewGroupProductReqDto,
  ): Promise<UpdateNewGroupProductResDto> {
    console.log('#kafkaTopic.PROD_MGMT.newGroupProducts.update', reqDto);

    return this.groupsProductsService.updateNewGroupProduct(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.newGroupProducts.updateNextNotification)
  async updateNextNotification(
    @Payload() id: string,
  ): Promise<UpdateNewGroupProductResDto> {
    console.log(
      '#kafkaTopic.PROD_MGMT.newGroupProducts.updateNextNotification',
      id,
    );

    return this.groupsProductsService.updateNextNotification(id);
  }
}
