import {
  CreateNewGroupProductReqDto,
  CreateNewGroupProductResDto,
  DeleteNewGroupProductReqDto,
  DeleteNewGroupProductResDto,
  GetNewGroupProductByIdReqDto,
  GetNewGroupProductByIdResDto,
  GetNewGroupProductsPaginatedReqDto,
  GetNewGroupProductsPaginatedResDto,
  RestoreNewGroupProductReqDto,
  RestoreNewGroupProductResDto,
  UpdateNewGroupProductReqDto,
  UpdateNewGroupProductResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/new-group-products';
import ms from 'ms';
import { PaginateQuery } from 'nestjs-paginate';
import { catchError, firstValueFrom, timeout } from 'rxjs';

import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { GetGrResDto, kafkaTopic, ProjectionParams } from '@nyp19vp-be/shared';

import { SocketGateway } from '../../socket/socket.gateway';
import {
  IRestockNoti,
  RESTOCKING_NOTI_EVENT_PATTERN,
} from '../interfaces/restocking-noti.interface';
import moment from 'moment';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NewGroupProductsService implements OnModuleInit {
  private timezone = process.env.TZ;

  constructor(
    @Inject('PROD_MGMT_SERVICE')
    private readonly prodMgmtClient: ClientKafka,

    private readonly socketGateway: SocketGateway,

    @Inject('PKG_MGMT_SERVICE')
    private readonly packageMgmtClient: ClientKafka,
  ) {}

  /**
   * Lifecycle hook that is called once the module has been initialized.
   * Subscribes to the response of all group product Kafka topics.
   */
  onModuleInit() {
    const groupProductTopics = Object.values(
      kafkaTopic.PROD_MGMT.newGroupProducts,
    );

    console.log(
      '#kafkaTopic.PROD_MGMT.newNewGroupProducts',
      groupProductTopics.join(', '),
    );

    for (const topic of groupProductTopics) {
      this.prodMgmtClient.subscribeToResponseOf(topic);
    }

    this.packageMgmtClient.subscribeToResponseOf(
      kafkaTopic.PKG_MGMT.GROUP.GET_BY_ID,
    );
  }

  /**
   * Creates a new group product.
   * @param reqDto The DTO containing the information of the group product to be created.
   * @returns A promise that resolves to the DTO containing the information of the created group product.
   */
  async createNewGroupProduct(
    reqDto: CreateNewGroupProductReqDto,
  ): Promise<CreateNewGroupProductResDto> {
    console.log('#kafkaTopic.PROD_MGMT.newGroupProducts.create', reqDto);

    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<CreateNewGroupProductResDto, CreateNewGroupProductReqDto>(
            kafkaTopic.PROD_MGMT.newGroupProducts.create,
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
  async getNewGroupProductById(
    groupId: string,
    id: string,
  ): Promise<GetNewGroupProductByIdResDto> {
    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<GetNewGroupProductByIdResDto, GetNewGroupProductByIdReqDto>(
            kafkaTopic.PROD_MGMT.newGroupProducts.getById,
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
  async getNewGroupProductsPaginated(
    query: PaginateQuery,
    groupId: string,
  ): Promise<GetNewGroupProductsPaginatedResDto> {
    console.log('query', query);

    const reqDto: GetNewGroupProductsPaginatedReqDto = {
      ...query,
      groupId,
    };

    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<
            GetNewGroupProductsPaginatedResDto,
            GetNewGroupProductsPaginatedReqDto
          >(kafkaTopic.PROD_MGMT.newGroupProducts.getPaginated, {
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
  async deleteNewGroupProduct(
    groupId: string,
    id: string,
  ): Promise<DeleteNewGroupProductResDto> {
    const reqDto: DeleteNewGroupProductReqDto = {
      groupId: groupId,
      id: id,
    };

    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<DeleteNewGroupProductResDto, DeleteNewGroupProductReqDto>(
            kafkaTopic.PROD_MGMT.newGroupProducts.delete,
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
  async restoreNewGroupProduct(
    groupId: string,
    id: string,
  ): Promise<RestoreNewGroupProductResDto> {
    const reqDto: RestoreNewGroupProductReqDto = {
      groupId: groupId,
      id: id,
    };

    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<RestoreNewGroupProductResDto, RestoreNewGroupProductReqDto>(
            kafkaTopic.PROD_MGMT.newGroupProducts.restore,
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
  async updateNewGroupProduct(
    groupId: string,
    id: string,
    reqDto: UpdateNewGroupProductReqDto,
  ): Promise<UpdateNewGroupProductResDto> {
    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<UpdateNewGroupProductResDto, UpdateNewGroupProductReqDto>(
            kafkaTopic.PROD_MGMT.newGroupProducts.update,
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

  async sendNoti(payload: IRestockNoti): Promise<void> {
    console.log('sendNoti', payload);

    if (!payload.id || !payload.groupId) {
      return;
    }

    const newGroupProduct = await this.getNewGroupProductById(
      payload.groupId,
      payload.id,
    );

    if (newGroupProduct.statusCode !== HttpStatus.OK) {
      return;
    } else {
      this.prodMgmtClient.send<UpdateNewGroupProductResDto, string>(
        kafkaTopic.PROD_MGMT.newGroupProducts.update,
        payload.id,
      );
    }

    const projectionParams: ProjectionParams = {
      proj: {
        members: true,
      },
      _id: payload.groupId,
    };

    const getGroup = await firstValueFrom(
      this.packageMgmtClient
        .send<GetGrResDto, ProjectionParams>(
          kafkaTopic.PKG_MGMT.GROUP.GET_BY_ID,
          {
            ...projectionParams,
          },
        )
        .pipe(timeout(ms('20s')))
        .pipe(
          catchError((error) => {
            console.log('error on get group', error);

            throw error;
          }),
        ),
    );

    const memberIds =
      getGroup?.group?.members?.map((member) => member.user._id) ?? [];

    console.log('memberIds', memberIds);

    Promise.all(
      memberIds.map(async (memberId) => {
        await this.socketGateway.handleEvent(
          RESTOCKING_NOTI_EVENT_PATTERN,
          memberId,
          payload,
        );
      }),
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async sendRestockNoti(page = 1) {
    console.log('Crone job running sendRestockNoti');

    const query: PaginateQuery = {
      page: page,
      limit: 100,
      sortBy: undefined,
      search: undefined,
      searchBy: undefined,
      filter: {
        nextNotification: `$lte:${moment().add(1, 'day').format('YYYY-MM-DD')}`,
      },
      select: undefined,
      path: undefined,
    };

    const res = await this.getNewGroupProductsPaginated(query, undefined);

    if (res.statusCode !== HttpStatus.OK) {
      return;
    }

    console.log('lenght:', res.data.length);

    // send noti for every new group product
    await Promise.all(
      res.data.map(async (newGroupProduct) => {
        if (newGroupProduct?.group?.id) {
          await this.sendNoti({
            id: newGroupProduct.id,
            groupId: newGroupProduct.group.id,
          });
        }
      }),
    );

    // new page
    if (res.meta.currentPage < res.meta.totalPages) {
      await this.sendRestockNoti(page + 1);
    }
  }
}
