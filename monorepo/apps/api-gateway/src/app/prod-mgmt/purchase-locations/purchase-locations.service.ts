import {
  CreatePurchaseLocationReqDto,
  CreatePurchaseLocationResDto,
  DeletePurchaseLocationReqDto,
  DeletePurchaseLocationResDto,
  GetPurchaseLocationByIdReqDto,
  GetPurchaseLocationByIdResDto,
  GetPurchaseLocationsPaginatedReqDto,
  GetPurchaseLocationsPaginatedResDto,
  RestorePurchaseLocationReqDto,
  RestorePurchaseLocationResDto,
  UpdatePurchaseLocationReqDto,
  UpdatePurchaseLocationResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/locations';
import ms from 'ms';
import { PaginateQuery } from 'nestjs-paginate';
import { firstValueFrom, timeout } from 'rxjs';

import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { kafkaTopic } from '@nyp19vp-be/shared';

@Injectable()
export class PurchaseLocationsService implements OnModuleInit {
  constructor(
    @Inject('PROD_MGMT_SERVICE')
    private readonly prodMgmtClient: ClientKafka,
  ) {}

  /**
   * Lifecycle hook, called once the module has been initialized.
   * Subscribes to all response topics for the purchase locations Kafka topics.
   */
  onModuleInit() {
    const groupProductTopics = Object.values(
      kafkaTopic.PROD_MGMT.purchaseLocations,
    );

    console.log(
      '#kafkaTopic.PROD_MGMT.purchaseLocations: ',
      groupProductTopics.join(', '),
    );

    for (const topic of groupProductTopics) {
      this.prodMgmtClient.subscribeToResponseOf(topic);
    }
  }

  /**
   * Creates a new purchase location.
   * @param createPurchaseLocationReqDto The DTO containing the data for the new purchase location.
   * @returns A Promise that resolves to the DTO of the created purchase location.
   */
  async createPurchaseLocation(
    createPurchaseLocationReqDto: CreatePurchaseLocationReqDto,
  ): Promise<CreatePurchaseLocationResDto> {
    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<CreatePurchaseLocationResDto, CreatePurchaseLocationReqDto>(
            kafkaTopic.PROD_MGMT.purchaseLocations.create,
            { ...createPurchaseLocationReqDto },
          )
          .pipe(timeout(ms('10s'))),
      );

      return res;
    } catch (error) {
      console.error('error', error);

      return {
        statusCode:
          error?.status ??
          error?.code ??
          error?.statusCode ??
          HttpStatus.INTERNAL_SERVER_ERROR,
        message: error?.message ?? 'Internal Server Error',
      };
    }
  }

  /**
   * Retrieves a purchase location by its ID.
   * @param groupId The ID of the group to which the purchase location belongs.
   * @param id The ID of the purchase location to retrieve.
   * @returns A Promise that resolves to the DTO of the retrieved purchase location.
   */
  async getPurchaseLocationById(
    groupId: string,
    id: string,
  ): Promise<GetPurchaseLocationByIdResDto> {
    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<GetPurchaseLocationByIdResDto, GetPurchaseLocationByIdReqDto>(
            kafkaTopic.PROD_MGMT.purchaseLocations.getById,
            {
              groupId: groupId,
              id: id,
            },
          )
          .pipe(timeout(ms('10s'))),
      );

      return res;
    } catch (error) {
      console.error('error', error);

      return {
        statusCode:
          error?.status ??
          error?.code ??
          error?.statusCode ??
          HttpStatus.INTERNAL_SERVER_ERROR,
        message: error?.message ?? 'Internal Server Error',
      };
    }
  }

  /**
   * Retrieves a paginated list of purchase locations for a given group.
   * @param query The query parameters for pagination.
   * @param groupId The ID of the group for which to retrieve the purchase locations.
   * @returns A Promise that resolves to the DTO of the retrieved paginated purchase locations.
   */
  async getPurchaseLocationsPaginated(
    query: PaginateQuery,
    groupId: string,
  ): Promise<GetPurchaseLocationsPaginatedResDto> {
    const reqDto: GetPurchaseLocationsPaginatedReqDto = {
      ...query,
      groupId,
    };

    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<
            GetPurchaseLocationsPaginatedResDto,
            GetPurchaseLocationsPaginatedReqDto
          >(kafkaTopic.PROD_MGMT.purchaseLocations.getPaginated, {
            ...reqDto,
          })
          .pipe(timeout(ms('10s'))),
      );

      return res;
    } catch (error) {
      console.error('error', error);
      return {
        statusCode:
          error?.status ??
          error?.code ??
          error?.statusCode ??
          HttpStatus.INTERNAL_SERVER_ERROR,
        message: error?.message ?? 'Internal Server Error',
        data: undefined,
        links: undefined,
        meta: undefined,
      };
    }
  }

  /**
   * Deletes a purchase location by its ID.
   * @param groupId The ID of the group to which the purchase location belongs.
   * @param id The ID of the purchase location to delete.
   * @returns A Promise that resolves to the DTO of the deleted purchase location.
   */
  async deletePurchaseLocation(
    groupId: string,
    id: string,
  ): Promise<DeletePurchaseLocationResDto> {
    const reqDto: DeletePurchaseLocationReqDto = {
      groupId: groupId,
      id: id,
    };

    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<DeletePurchaseLocationResDto, DeletePurchaseLocationReqDto>(
            kafkaTopic.PROD_MGMT.purchaseLocations.delete,
            {
              ...reqDto,
            },
          )
          .pipe(timeout(ms('10s'))),
      );

      return res;
    } catch (error) {
      console.error('error', error);

      return {
        statusCode:
          error?.status ??
          error?.code ??
          error?.statusCode ??
          HttpStatus.INTERNAL_SERVER_ERROR,
        message: error?.message ?? 'Internal Server Error',
      };
    }
  }

  /**
   * Restores a previously deleted purchase location by its ID.
   * @param groupId The ID of the group to which the purchase location belongs.
   * @param id The ID of the purchase location to restore.
   * @returns A Promise that resolves to the DTO of the restored purchase location.
   */
  async restorePurchaseLocation(
    groupId: string,
    id: string,
  ): Promise<RestorePurchaseLocationResDto> {
    const reqDto: RestorePurchaseLocationReqDto = {
      groupId: groupId,
      id: id,
    };

    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<RestorePurchaseLocationResDto, RestorePurchaseLocationReqDto>(
            kafkaTopic.PROD_MGMT.purchaseLocations.restore,
            {
              ...reqDto,
            },
          )
          .pipe(timeout(ms('10s'))),
      );

      return res;
    } catch (error) {
      console.error('error', error);

      return {
        statusCode:
          error?.status ??
          error?.code ??
          error?.statusCode ??
          HttpStatus.INTERNAL_SERVER_ERROR,
        message: error?.message ?? 'Internal Server Error',
      };
    }
  }

  /**
   * Updates an existing purchase location by its ID.
   * @param groupId The ID of the group to which the purchase location belongs.
   * @param id The ID of the purchase location to update.
   * @param data The DTO containing the updated data for the purchase location.
   * @returns A Promise that resolves to the DTO of the updated purchase location.
   */
  async updatePurchaseLocation(
    groupId: string,
    id: string,
    data: UpdatePurchaseLocationReqDto,
  ): Promise<UpdatePurchaseLocationResDto> {
    const reqDto: UpdatePurchaseLocationReqDto = {
      groupId: groupId,
      id: id,
      ...data,
    };

    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<UpdatePurchaseLocationResDto, UpdatePurchaseLocationReqDto>(
            kafkaTopic.PROD_MGMT.purchaseLocations.update,
            {
              ...reqDto,
            },
          )
          .pipe(timeout(ms('10s'))),
      );

      return res;
    } catch (error) {
      console.error('error', error);

      return {
        statusCode:
          error?.status ??
          error?.code ??
          error?.statusCode ??
          HttpStatus.INTERNAL_SERVER_ERROR,
        message: error?.message ?? 'Internal Server Error',
      };
    }
  }
}
