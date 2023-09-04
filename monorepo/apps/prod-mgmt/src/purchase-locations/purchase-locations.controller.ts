import {
  CreatePurchaseLocationReqDto,
  CreatePurchaseLocationResDto,
  DeletePurchaseLocationReqDto,
  DeletePurchaseLocationResDto,
  GetPurchaseLocationByIdReqDto,
  GetPurchaseLocationByIdResDto,
  GetPurchaseLocationsPaginatedReqDto,
  UpdatePurchaseLocationReqDto,
  UpdatePurchaseLocationResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/locations';
import {
  RestoreGroupProductReqDto,
  RestoreGroupProductResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/products';

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { kafkaTopic } from '@nyp19vp-be/shared';

import { PurchaseLocationsService } from './purchase-locations.service';

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
