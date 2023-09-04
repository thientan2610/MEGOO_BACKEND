import {
  CreateGroupProductReqDto,
  CreateGroupProductResDto,
  DeleteGroupProductReqDto,
  DeleteGroupProductResDto,
  GetGroupProductByIdReqDto,
  GetGroupProductByIdResDto,
  GetGroupProductsPaginatedReqDto,
  RestoreGroupProductReqDto,
  RestoreGroupProductResDto,
  UpdateGroupProductReqDto,
  UpdateGroupProductResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/products';

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { kafkaTopic } from '@nyp19vp-be/shared';

import { GroupsProductsService } from './groups-products.service';

@Controller()
export class GroupsProductsController {
  constructor(private readonly groupsProductsService: GroupsProductsService) {}

  @MessagePattern(kafkaTopic.PROD_MGMT.groupProducts.create)
  async createGroupProduct(
    @Payload() reqDto: CreateGroupProductReqDto,
  ): Promise<CreateGroupProductResDto> {
    console.log('#kafkaTopic.PROD_MGMT.groupProducts.create', reqDto);

    return this.groupsProductsService.createGroupProduct(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.groupProducts.getById)
  async getGroupProductById(
    @Payload() reqDto: GetGroupProductByIdReqDto,
  ): Promise<GetGroupProductByIdResDto> {
    console.log('#kafkaTopic.PROD_MGMT.groupProducts.getById', reqDto);

    return this.groupsProductsService.getGroupProductById(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.groupProducts.getPaginated)
  async getGroupProductsPaginated(
    @Payload() reqDto: GetGroupProductsPaginatedReqDto,
  ) {
    console.log('#kafkaTopic.PROD_MGMT.groupProducts.getPaginated', reqDto);

    return this.groupsProductsService.getGroupProductsPaginated(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.groupProducts.delete)
  async deleteGroupProduct(
    @Payload() reqDto: DeleteGroupProductReqDto,
  ): Promise<DeleteGroupProductResDto> {
    console.log('#kafkaTopic.PROD_MGMT.groupProducts.delete', reqDto);

    return this.groupsProductsService.deleteGroupProduct(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.groupProducts.restore)
  async restoreGroupProduct(
    @Payload() reqDto: RestoreGroupProductReqDto,
  ): Promise<RestoreGroupProductResDto> {
    console.log('#kafkaTopic.PROD_MGMT.groupProducts.restore', reqDto);

    return this.groupsProductsService.restoreGroupProduct(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.groupProducts.update)
  async updateGroupProduct(
    @Payload() reqDto: UpdateGroupProductReqDto,
  ): Promise<UpdateGroupProductResDto> {
    console.log('#kafkaTopic.PROD_MGMT.groupProducts.update', reqDto);

    return this.groupsProductsService.updateGroupProduct(reqDto);
  }
}
