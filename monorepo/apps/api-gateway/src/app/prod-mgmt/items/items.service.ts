import { INoti } from 'apps/api-gateway/src/app/prod-mgmt/interfaces/noti.interface';
import { SocketGateway } from 'apps/api-gateway/src/app/socket/socket.gateway';
import {
  CreateItemReqDto,
  CreateItemResDto,
  DeleteItemReqDto,
  DeleteItemResDto,
  GetItemByIdReqDto,
  GetItemByIdResDto,
  GetItemsPaginatedReqDto,
  GetItemsPaginatedResDto,
  RestoreItemReqDto,
  RestoreItemResDto,
  UpdateItemReqDto,
  UpdateItemResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/items';
import ms from 'ms';
import { PaginateQuery } from 'nestjs-paginate';
import { catchError, firstValueFrom, timeout } from 'rxjs';

import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GetGrResDto, kafkaTopic, ProjectionParams } from '@nyp19vp-be/shared';

@Injectable()
export class ItemsService implements OnModuleInit {
  constructor(
    @Inject('PROD_MGMT_SERVICE')
    private readonly prodMgmtClient: ClientKafka,

    @Inject('PKG_MGMT_SERVICE')
    private readonly packageMgmtClient: ClientKafka,

    private readonly socketGateway: SocketGateway,
  ) {}

  /**
   * Lifecycle hook, called once the module has been initialized.
   * Subscribes to all response topics for the PROD_MGMT.items Kafka group.
   */
  onModuleInit(): void {
    const groupProductTopics = Object.values(kafkaTopic.PROD_MGMT.items);

    console.log(
      '#kafkaTopic.PROD_MGMT.groupProducts',
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
   * Creates a new item.
   * @param reqDto The DTO containing the data for the new item.
   * @returns A Promise that resolves to a CreateItemResDto object containing the newly created item's data.
   */
  async createItem(reqDto: CreateItemReqDto): Promise<CreateItemResDto> {
    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<CreateItemResDto, CreateItemReqDto>(
            kafkaTopic.PROD_MGMT.items.create,
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
   * Retrieves an item by its ID.
   * @param id The ID of the item to retrieve.
   * @returns A Promise that resolves to a GetItemByIdResDto object containing the retrieved item's data.
   */
  async getItemById(groupId: string, id: string): Promise<GetItemByIdResDto> {
    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<GetItemByIdResDto, GetItemByIdReqDto>(
            kafkaTopic.PROD_MGMT.items.getById,
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
   * Retrieves a paginated list of items for a given group and group product.
   * @param groupId The ID of the group to retrieve items for.
   * @param groupProductId The ID of the group product to retrieve items for.
   * @param query The pagination query parameters.
   * @returns A Promise that resolves to a GetItemsPaginatedResDto object containing the paginated list of items.
   */
  async getItemsPaginated(
    groupId: string,
    groupProductId: string,
    query: PaginateQuery,
  ): Promise<GetItemsPaginatedResDto> {
    const reqDto: GetItemsPaginatedReqDto = {
      groupId: groupId,
      groupProductId: groupProductId,
      ...query,
    };

    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<GetItemsPaginatedResDto, GetItemsPaginatedReqDto>(
            kafkaTopic.PROD_MGMT.items.getPaginated,
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
        data: undefined,
        links: undefined,
        meta: undefined,
      };
    }
  }

  /**
   * Deletes an item by its ID.
   * @param groupId The ID of the group to delete the item from.
   * @param id The ID of the item to delete.
   * @returns A Promise that resolves to a DeleteItemResDto object containing the result of the delete operation.
   */
  async deleteItem(groupId: string, id: string): Promise<DeleteItemResDto> {
    const reqDto: DeleteItemReqDto = {
      groupId: groupId,
      id: id,
    };

    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<DeleteItemResDto, DeleteItemReqDto>(
            kafkaTopic.PROD_MGMT.items.delete,
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

  async restoreItem(groupId: string, id: string): Promise<RestoreItemResDto> {
    const reqDto: RestoreItemReqDto = {
      groupId: groupId,
      id: id,
    };

    try {
      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<RestoreItemResDto, RestoreItemReqDto>(
            kafkaTopic.PROD_MGMT.items.restore,
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

  async updateItem(
    groupId: string,
    id: string,
    reqDto: UpdateItemReqDto,
  ): Promise<UpdateItemResDto> {
    reqDto.groupId = groupId;
    reqDto.id = id;

    try {
      console.log('#kafkaTopic.PROD_MGMT.items.update', reqDto);

      const res = await firstValueFrom(
        this.prodMgmtClient
          .send<UpdateItemResDto, UpdateItemReqDto>(
            kafkaTopic.PROD_MGMT.items.update,
            { ...reqDto },
          )
          .pipe(timeout(ms('10s'))),
      );

      // check if quantity has changed to lower than 2, if so, send a socket event
      if (
        reqDto?.quantity !== undefined &&
        reqDto?.quantity !== null &&
        (res?.data?.quantity || res?.data?.quantity === 0)
      ) {
        const newQuantity = res.data.quantity;
        const payload: INoti = {
          groupId: groupId,
          itemId: id,
          type: undefined,
        };

        // params: {"sorter":{"createdAt":1},"proj":{"members":true},"_id":"64e585d5994fc1d78ff0ea4b"}
        const projectionParams: ProjectionParams = {
          proj: {
            members: true,
          },
          _id: groupId,
        };

        const getGroup = await firstValueFrom(
          this.packageMgmtClient
            .send<GetGrResDto, ProjectionParams>(
              kafkaTopic.PKG_MGMT.GROUP.GET_BY_ID,
              {
                ...projectionParams,
              },
            )
            .pipe(timeout(ms('10s')))
            .pipe(
              catchError((error) => {
                console.log('error on get group', error);

                throw error;
              }),
            ),
        );

        const memberIds = getGroup.group.members.map(
          (member) => member.user._id,
        );

        console.log('memberIds', memberIds);

        if (newQuantity === 0) {
          payload.type = 'outOfStock';
        } else if (newQuantity < 2) {
          payload.type = 'runningOutOfStock';
        }

        if (payload.type) {
          console.log('send socket event', payload);

          // send socket event to all members of the group
          Promise.all(
            memberIds.map(async (memberId) => {
              await this.socketGateway.handleEvent(
                'prodNoti',
                memberId,
                payload,
              );
            }),
          );
        }
      }

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
