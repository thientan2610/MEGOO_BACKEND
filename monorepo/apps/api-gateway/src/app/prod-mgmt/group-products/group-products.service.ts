import {
  CreateGroupProductReqDto,
  CreateGroupProductResDto,
  DeleteGroupProductReqDto,
  DeleteGroupProductResDto,
  GetGroupProductByIdReqDto,
  GetGroupProductByIdResDto,
  GetGroupProductsPaginatedReqDto,
  GetGroupProductsPaginatedResDto,
  RestoreGroupProductReqDto,
  RestoreGroupProductResDto,
  UpdateGroupProductReqDto,
  UpdateGroupProductResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/products';
import ms from 'ms';
import { PaginateQuery } from 'nestjs-paginate';
import { firstValueFrom, timeout } from 'rxjs';

import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { kafkaTopic } from '@nyp19vp-be/shared';

@Injectable()
export class GroupProductsService implements OnModuleInit {
  constructor(
    @Inject('PROD_MGMT_SERVICE')
    private readonly prodMgmtClient: ClientKafka,
  ) {}

  /**
   * Lifecycle hook that is called once the module has been initialized.
   * Subscribes to the response of all group product Kafka topics.
   */
  onModuleInit() {
    const groupProductTopics = Object.values(
      kafkaTopic.PROD_MGMT.groupProducts,
    );

    console.log(
      '#kafkaTopic.PROD_MGMT.groupProducts',
      groupProductTopics.join(', '),
    );

    for (const topic of groupProductTopics) {
      this.prodMgmtClient.subscribeToResponseOf(topic);
    }
  }

  /**
   * Creates a new group product.
   * @param reqDto The DTO containing the information of the group product to be created.
   * @returns A promise that resolves to the DTO containing the information of the created group product.
   */
  async createGroupProduct(
    reqDto: CreateGroupProductReqDto,
  ): Promise<CreateGroupProductResDto> {
    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<CreateGroupProductResDto, CreateGroupProductReqDto>(
            kafkaTopic.PROD_MGMT.groupProducts.create,
            {
              ...reqDto,
            },
          )
          .pipe(timeout(ms('10s'))),
      );

      return res;
    } catch (error) {
      console.log('error', error);
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
   * Retrieves a specific group product by its ID.
   * @param groupId The ID of the group the product belongs to.
   * @param id The ID of the product to retrieve.
   * @returns A promise that resolves to the DTO containing the information of the retrieved group product.
   */
  async getGroupProductById(
    groupId: string,
    id: string,
  ): Promise<GetGroupProductByIdResDto> {
    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<GetGroupProductByIdResDto, GetGroupProductByIdReqDto>(
            kafkaTopic.PROD_MGMT.groupProducts.getById,
            {
              groupId,
              id,
            },
          )
          .pipe(timeout(ms('10s'))),
      );

      return res;
    } catch (error) {
      console.log('error', error);
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
   * Retrieves a paginated list of products belonging to a specific group.
   * @param query The pagination query parameters.
   * @param groupId The ID of the group to retrieve products for.
   * @returns A promise that resolves to the DTO containing the paginated list of products.
   */
  async getGroupProductsPaginated(
    query: PaginateQuery,
    groupId: string,
  ): Promise<GetGroupProductsPaginatedResDto> {
    const reqDto: GetGroupProductsPaginatedReqDto = {
      ...query,
      groupId,
    };

    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<
            GetGroupProductsPaginatedResDto,
            GetGroupProductsPaginatedReqDto
          >(kafkaTopic.PROD_MGMT.groupProducts.getPaginated, {
            ...reqDto,
          })
          .pipe(timeout(ms('10s'))),
      );

      return res;
    } catch (error) {
      console.log('error', error);
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
   * Deletes a group product with the specified ID.
   * @param groupId The ID of the group that the product belongs to.
   * @param id The ID of the product to delete.
   * @returns A promise that resolves to the DTO containing the result of the delete operation.
   */
  async deleteGroupProduct(
    groupId: string,
    id: string,
  ): Promise<DeleteGroupProductResDto> {
    const reqDto: DeleteGroupProductReqDto = {
      groupId: groupId,
      id: id,
    };

    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<DeleteGroupProductResDto, DeleteGroupProductReqDto>(
            kafkaTopic.PROD_MGMT.groupProducts.delete,
            {
              ...reqDto,
            },
          )
          .pipe(timeout(ms('10s'))),
      );

      return res;
    } catch (error) {
      console.log('error', error);
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
   * Restores a previously deleted group product with the specified ID.
   * @param groupId The ID of the group that the product belongs to.
   * @param id The ID of the product to restore.
   * @returns A promise that resolves to the DTO containing the result of the restore operation.
   */
  async restoreGroupProduct(
    groupId: string,
    id: string,
  ): Promise<RestoreGroupProductResDto> {
    const reqDto: RestoreGroupProductReqDto = {
      groupId: groupId,
      id: id,
    };

    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<RestoreGroupProductResDto, RestoreGroupProductReqDto>(
            kafkaTopic.PROD_MGMT.groupProducts.restore,
            {
              ...reqDto,
            },
          )
          .pipe(timeout(ms('10s'))),
      );

      return res;
    } catch (error) {
      console.log('error', error);
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
   * Updates a group product with the specified ID.
   * @param groupId The ID of the group that the product belongs to.
   * @param id The ID of the product to update.
   * @param reqDto The DTO containing the updated information of the group product.
   * @returns A promise that resolves to the DTO containing the result of the update operation.
   */
  async updateGroupProduct(
    groupId: string,
    id: string,
    reqDto: UpdateGroupProductReqDto,
  ): Promise<UpdateGroupProductResDto> {
    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<UpdateGroupProductResDto, UpdateGroupProductReqDto>(
            kafkaTopic.PROD_MGMT.groupProducts.update,
            {
              groupId,
              id,
              ...reqDto,
            },
          )
          .pipe(timeout(ms('10s'))),
      );

      return res;
    } catch (error) {
      console.log('error', error);
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
