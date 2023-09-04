import {
  CreateStorageLocationReqDto,
  CreateStorageLocationResDto,
  DeleteStorageLocationReqDto,
  DeleteStorageLocationResDto,
  GetStorageLocationByIdReqDto,
  GetStorageLocationByIdResDto,
  GetStorageLocationsPaginatedReqDto,
  RestoreStorageLocationReqDto,
  RestoreStorageLocationResDto,
  UpdateStorageLocationReqDto,
  UpdateStorageLocationResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/locations';

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { kafkaTopic } from '@nyp19vp-be/shared';

import { StorageLocationsService } from './storage-locations.service';

/*
@Controller()
export class LocationsController {
  constructor(
    private readonly purchaseLocationsService: PurchaseLocationsService,
  ) {}

  @MessagePattern(kafkaTopic.PROD_MGMT.purchaseLocations.create)
  async createPurchaseLocation(
    @Payload() reqDto: CreatePurchaseLocationReqDto,
  ): Promise<CreatePurchaseLocationResDto> {
    console.log('#kafkaTopic.PROD_MGMT.purchaseLocations.create', reqDto);

    return this.purchaseLocationsService.createPurchaseLocation(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.purchaseLocations.getById)
  async getPurchaseLocationById(
    @Payload() reqDto: GetPurchaseLocationByIdReqDto,
  ): Promise<GetPurchaseLocationByIdResDto> {
    console.log('#kafkaTopic.PROD_MGMT.purchaseLocations.getById', reqDto);

    return this.purchaseLocationsService.getPurchaseLocationById(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.purchaseLocations.getPaginated)
  async getPurchaseLocationsPaginated(
    @Payload() reqDto: GetPurchaseLocationsPaginatedReqDto,
  ) {
    console.log('#kafkaTopic.PROD_MGMT.purchaseLocations.getPaginated', reqDto);

    return this.purchaseLocationsService.getPurchaseLocationsPaginated(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.purchaseLocations.delete)
  async deletePurchaseLocation(
    @Payload() reqDto: DeletePurchaseLocationReqDto,
  ): Promise<DeletePurchaseLocationResDto> {
    console.log('#kafkaTopic.PROD_MGMT.purchaseLocations.delete', reqDto);

    return this.purchaseLocationsService.deletePurchaseLocation(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.purchaseLocations.restore)
  async restorePurchaseLocation(
    @Payload() reqDto: RestoreGroupProductReqDto,
  ): Promise<RestoreGroupProductResDto> {
    console.log('#kafkaTopic.PROD_MGMT.purchaseLocations.restore', reqDto);

    return this.purchaseLocationsService.restorePurchaseLocation(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.purchaseLocations.update)
  async updatePurchaseLocation(
    @Payload() reqDto: UpdatePurchaseLocationReqDto,
  ): Promise<UpdatePurchaseLocationResDto> {
    console.log('#kafkaTopic.PROD_MGMT.purchaseLocations.update', reqDto);

    return this.purchaseLocationsService.updatePurchaseLocation(reqDto);
  }
}
*/

@Controller()
export class StorageLocationsController {
  constructor(
    private readonly storageLocationsService: StorageLocationsService,
  ) {}

  @MessagePattern(kafkaTopic.PROD_MGMT.storageLocations.create)
  async createStorageLocation(
    @Payload() reqDto: CreateStorageLocationReqDto,
  ): Promise<CreateStorageLocationResDto> {
    console.log('#kafkaTopic.PROD_MGMT.storageLocations.create', reqDto);

    return this.storageLocationsService.createStorageLocation(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.storageLocations.getById)
  async getStorageLocationById(
    @Payload() reqDto: GetStorageLocationByIdReqDto,
  ): Promise<GetStorageLocationByIdResDto> {
    console.log('#kafkaTopic.PROD_MGMT.storageLocations.getById', reqDto);

    return this.storageLocationsService.getStorageLocationById(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.storageLocations.getPaginated)
  async getStorageLocationsPaginated(
    @Payload() reqDto: GetStorageLocationsPaginatedReqDto,
  ) {
    console.log('#kafkaTopic.PROD_MGMT.storageLocations.getPaginated', reqDto);

    return this.storageLocationsService.getStorageLocationsPaginated(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.storageLocations.delete)
  async deleteStorageLocation(
    @Payload() reqDto: DeleteStorageLocationReqDto,
  ): Promise<DeleteStorageLocationResDto> {
    console.log('#kafkaTopic.PROD_MGMT.storageLocations.delete', reqDto);

    return this.storageLocationsService.deleteStorageLocation(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.storageLocations.restore)
  async restoreStorageLocation(
    @Payload() reqDto: RestoreStorageLocationReqDto,
  ): Promise<RestoreStorageLocationResDto> {
    console.log('#kafkaTopic.PROD_MGMT.storageLocations.restore', reqDto);

    return this.storageLocationsService.restoreStorageLocation(reqDto);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.storageLocations.update)
  async updateStorageLocation(
    @Payload() reqDto: UpdateStorageLocationReqDto,
  ): Promise<UpdateStorageLocationResDto> {
    console.log('#kafkaTopic.PROD_MGMT.storageLocations.update', reqDto);

    return this.storageLocationsService.updateStorageLocation(reqDto);
  }
}
