import {
  CreateStorageLocationReqDto,
  CreateStorageLocationResDto,
  DeleteStorageLocationReqDto,
  DeleteStorageLocationResDto,
  GetStorageLocationByIdReqDto,
  GetStorageLocationByIdResDto,
  GetStorageLocationsPaginatedReqDto,
  GetStorageLocationsPaginatedResDto,
  RestoreStorageLocationReqDto,
  RestoreStorageLocationResDto,
  UpdateStorageLocationReqDto,
  UpdateStorageLocationResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/locations';
import ms from 'ms';
import { PaginateQuery } from 'nestjs-paginate';
import { firstValueFrom, timeout } from 'rxjs';

import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { kafkaTopic } from '@nyp19vp-be/shared';

@Injectable()
export class StorageLocationsService implements OnModuleInit {
  constructor(
    @Inject('PROD_MGMT_SERVICE')
    private readonly prodMgmtClient: ClientKafka,
  ) {}

  /**
   * Lifecycle hook, called once the StorageLocationsService has been initialized.
   * Subscribes to all the Kafka topics related to storage locations in the PROD_MGMT service.
   */
  onModuleInit() {
    const groupProductTopics = Object.values(
      kafkaTopic.PROD_MGMT.storageLocations,
    );

    console.log(
      '#kafkaTopic.PROD_MGMT.storageLocations:',
      groupProductTopics.join(', '),
    );

    for (const topic of groupProductTopics) {
      this.prodMgmtClient.subscribeToResponseOf(topic);
    }
  }

  /**
   * Creates a new storage location with the given request data.
   * @param reqDto The request data for creating the storage location.
   * @returns A Promise that resolves to the response data for the created storage location.
   * If an error occurs, the Promise resolves to an object with a statusCode and message property.
   */
  async createStorageLocation(
    reqDto: CreateStorageLocationReqDto,
  ): Promise<CreateStorageLocationResDto> {
    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<CreateStorageLocationResDto, CreateStorageLocationReqDto>(
            kafkaTopic.PROD_MGMT.storageLocations.create,
            { ...reqDto },
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
   * Retrieves a storage location by its ID.
   * @param groupId The ID of the group to which the storage location belongs.
   * @param id The ID of the storage location to retrieve.
   * @returns A Promise that resolves to the response data for the retrieved storage location.
   * If an error occurs, the Promise resolves to an object with a statusCode and message property.
   */
  async getStorageLocationById(
    groupId: string,
    id: string,
  ): Promise<GetStorageLocationByIdResDto> {
    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<GetStorageLocationByIdResDto, GetStorageLocationByIdReqDto>(
            kafkaTopic.PROD_MGMT.storageLocations.getById,
            {
              groupId,
              id,
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
   * Retrieves a paginated list of storage locations for the given group ID and query parameters.
   * @param query The query parameters for pagination.
   * @param groupId The ID of the group to which the storage locations belong.
   * @returns A Promise that resolves to the response data for the retrieved storage locations.
   * If an error occurs, the Promise resolves to an object with a statusCode, message, data, links, and meta property.
   */
  async getStorageLocationsPaginated(
    query: PaginateQuery,
    groupId: string,
  ): Promise<GetStorageLocationsPaginatedResDto> {
    const reqDto: GetStorageLocationsPaginatedReqDto = {
      ...query,
      groupId,
    };

    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<
            GetStorageLocationsPaginatedResDto,
            GetStorageLocationsPaginatedReqDto
          >(kafkaTopic.PROD_MGMT.storageLocations.getPaginated, {
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
   * Deletes a storage location by its ID.
   * @param groupId The ID of the group to which the storage location belongs.
   * @param id The ID of the storage location to delete.
   * @returns A Promise that resolves to the response data for the deleted storage location.
   * If an error occurs, the Promise resolves to an object with a statusCode and message property.
   */
  async deleteStorageLocation(
    groupId: string,
    id: string,
  ): Promise<DeleteStorageLocationResDto> {
    const reqDto: DeleteStorageLocationReqDto = {
      groupId,
      id,
    };

    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<DeleteStorageLocationResDto, DeleteStorageLocationReqDto>(
            kafkaTopic.PROD_MGMT.storageLocations.delete,
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
   * Restores a previously deleted storage location by its ID.
   * @param groupId The ID of the group to which the storage location belongs.
   * @param id The ID of the storage location to restore.
   * @returns A Promise that resolves to the response data for the restored storage location.
   * If an error occurs, the Promise resolves to an object with a statusCode and message property.
   */
  async restoreStorageLocation(
    groupId: string,
    id: string,
  ): Promise<RestoreStorageLocationResDto> {
    const reqDto: RestoreStorageLocationReqDto = {
      groupId,
      id,
    };

    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<RestoreStorageLocationResDto, RestoreStorageLocationReqDto>(
            kafkaTopic.PROD_MGMT.storageLocations.restore,
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
   * Updates an existing storage location with the given request data.
   * @param groupId The ID of the group to which the storage location belongs.
   * @param id The ID of the storage location to update.
   * @param reqDto The request data for updating the storage location.
   * @returns A Promise that resolves to the response data for the updated storage location.
   * If an error occurs, the Promise resolves to an object with a statusCode and message property.
   */
  async updateStorageLocation(
    groupId: string,
    id: string,
    reqDto: UpdateStorageLocationReqDto,
  ): Promise<UpdateStorageLocationResDto> {
    const req: UpdateStorageLocationReqDto = {
      ...reqDto,
      groupId,
      id,
    };

    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<UpdateStorageLocationResDto, UpdateStorageLocationReqDto>(
            kafkaTopic.PROD_MGMT.storageLocations.update,
            {
              ...req,
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
