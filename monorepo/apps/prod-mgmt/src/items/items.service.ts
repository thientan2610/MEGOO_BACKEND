import { ProdMgmtItemDto } from 'libs/shared/src/lib/dto/prod-mgmt/dto/item.dto';
import {
  CreateItemReqDto,
  CreateItemResDto,
  DeleteItemReqDto,
  DeleteItemResDto,
  GetItemByIdReqDto,
  GetItemByIdResDto,
  GetItemsPaginatedReqDto,
  RestoreItemReqDto,
  RestoreItemResDto,
  UpdateItemReqDto,
  UpdateItemResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/items';
import moment from 'moment';
import { IsNull, Not, Repository } from 'typeorm';

import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';

import { GroupProductEntity } from '../entities/group-product.entity';
import { ItemEntity } from '../entities/item.entity';
import { PurchaseLocationEntity } from '../entities/purchase-location.entity';
import { StorageLocationEntity } from '../entities/storage-location.entity';
import { paginate } from 'nestjs-paginate';
import { GroupsProductsService } from '../groups-products/groups-products.service';
import { PurchaseLocationsService } from '../purchase-locations/purchase-locations.service';
import { StorageLocationsService } from '../storage-locations/storage-locations.service';
import { AppService } from '../app/app.service';
import { itemsPaginateConfig } from './paginate-config/pagination.config';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(GroupProductEntity)
    private readonly groupProductRepo: Repository<GroupProductEntity>,

    @InjectRepository(StorageLocationEntity)
    private readonly storageLocationRepo: Repository<StorageLocationEntity>,

    @InjectRepository(PurchaseLocationEntity)
    private readonly purchaseLocationRepo: Repository<PurchaseLocationEntity>,

    @InjectRepository(ItemEntity)
    private readonly itemRepo: Repository<ItemEntity>,
  ) {}

  /**
   * Converts an ItemEntity object to an ItemDto object.
   * @param item The ItemEntity object to convert.
   * @returns The converted ItemDto object.
   */
  public static toDto(item: ItemEntity): ProdMgmtItemDto {
    return {
      id: item.id,
      addedBy: item.addedBy,
      bestBefore: item.bestBefore,
      image: item.image,
      quantity: item.quantity,
      unit: item.unit,
      timestamp: item.timestamp,
      groupProduct: GroupsProductsService.toDto(item.groupProduct),
      purchaseLocation: PurchaseLocationsService.toDto(item.purchaseLocation),
      storageLocation: StorageLocationsService.toDto(item.storageLocation),
    };
  }

  private static validateItemId(itemId: string) {
    if (!itemId) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Item ID is required',
      });
    }
  }

  /**
   * Creates a new item.
   * @param reqDto The DTO containing the information needed to create the item.
   * @returns The DTO containing the newly created item's information.
   * @throws RpcException if the group product, storage location, or purchase location does not exist.
   */
  async create(reqDto: CreateItemReqDto): Promise<CreateItemResDto> {
    const [groupProduct, storageLocation, purchaseLocation] = await Promise.all(
      [
        this.groupProductRepo.findOne({
          where: {
            id: reqDto.groupProductId,
          },
        }),
        this.storageLocationRepo.findOne({
          where: {
            id: reqDto.storageLocationId,
          },
        }),
        this.purchaseLocationRepo.findOne({
          where: {
            id: reqDto.purchaseLocationId,
          },
        }),
      ],
    );

    // check if groupProduct, storageLocation, purchaseLocation exist
    if (!groupProduct) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `GroupProduct with id ${reqDto.groupProductId} does not exist`,
      });
    }

    if (!storageLocation) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `StorageLocation with id ${reqDto.storageLocationId} does not exist`,
      });
    }

    if (!purchaseLocation) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `PurchaseLocation with id ${reqDto.purchaseLocationId} does not exist`,
      });
    }

    const item = this.itemRepo.create({
      addedBy: reqDto.addedBy,
      bestBefore: moment(reqDto.bestBefore).toDate(),
      quantity: reqDto.quantity,
      unit: reqDto.unit,
      image: reqDto.image ?? groupProduct.image,
      groupProduct: groupProduct,
      storageLocation: storageLocation,
      purchaseLocation: purchaseLocation,
    });

    await this.itemRepo.save(item);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Item created successfully',
      data: ItemsService.toDto(item),
    };
  }

  /**
   * Retrieves an item by its ID and group ID.
   * @param reqDto The DTO containing the information needed to retrieve the item.
   * @returns The DTO containing the retrieved item's information.
   * @throws RpcException if the item does not exist.
   */
  async getById(reqDto: GetItemByIdReqDto): Promise<GetItemByIdResDto> {
    // check if groupId is provided
    AppService.validateGroupId(reqDto.groupId);

    // check if itemId is provided
    ItemsService.validateItemId(reqDto.id);

    const item = await this.itemRepo.findOneBy({
      groupProduct: {
        group: {
          id: reqDto.groupId,
        },
      },
      id: reqDto.id,
    });

    if (!item) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Item with id ${reqDto.id} does not exist`,
      });
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Item retrieved successfully',
      data: ItemsService.toDto(item),
    };
  }

  /**
   * Retrieves a paginated list of items for a specific group product and group.
   * @param reqDto The DTO containing the information needed to retrieve the paginated list of items.
   * @returns The paginated list of items.
   */
  async getPaginated(reqDto: GetItemsPaginatedReqDto) {
    // check if groupId is provided
    AppService.validateGroupId(reqDto.groupId);

    // create custom query builder to filter by group id and group product id (if provided)
    const qb = this.itemRepo
      .createQueryBuilder('i')
      .leftJoin(GroupProductEntity, 'gp', 'gp.id = i.group_product_id')
      .andWhere('gp.group_id = :groupId', { groupId: reqDto.groupId });

    if (reqDto.groupProductId) {
      qb.andWhere('gp.id = :groupProductId', {
        groupProductId: reqDto.groupProductId,
      });
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Get group products paginated successfully',
      ...(await paginate(reqDto, qb, {
        ...itemsPaginateConfig,
        withDeleted: reqDto?.filter?.['timestamp.deletedAt'] ? true : false, // trick to get soft deleted items
      })),
    };
  }

  /**
   * Updates an existing item.
   * @param reqDto The DTO containing the information needed to update the item.
   * @returns The DTO containing the updated item's information.
   * @throws RpcException if the item does not exist or if the update fails.
   */
  async update(reqDto: UpdateItemReqDto): Promise<UpdateItemResDto> {
    // check if groupId is provided
    AppService.validateGroupId(reqDto.groupId);

    // check if itemId is provided
    ItemsService.validateItemId(reqDto.id);

    const groupId = reqDto.groupId;
    const id = reqDto.id;

    // remove group id and id from the request dto to prevent updating them
    delete reqDto.groupId;
    delete reqDto.id;

    // find the item
    const item = await this.itemRepo.findOneBy({
      id: id,
      groupProduct: {
        group: {
          id: groupId,
        },
      },
    });

    if (!item) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Item not found',
      });
    }

    // change update from string to date
    if (reqDto.bestBefore) {
      reqDto.bestBefore = moment(reqDto.bestBefore).toDate();
    }

    // for each exist field, update it in the group product if this key also exist in group product
    for (const key in reqDto) {
      if (reqDto[key] && item[key]) {
        item[key] = reqDto[key];
      }
    }

    // for quantity
    if (reqDto.quantity === 0) {
      item.quantity = 0;
    }

    // save the updated group product
    try {
      await this.itemRepo.save(item);
    } catch (error) {
      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Update item failed',
        data: error?.data || undefined,
      });
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Update group product successfully',
      data: ItemsService.toDto(item),
    };
  }

  /**
   * Soft deletes an existing item.
   * @param reqDto The DTO containing the information needed to delete the item.
   * @returns The DTO containing the result of the delete operation.
   * @throws RpcException if the item does not exist or if the delete fails.
   */
  async delete(reqDto: DeleteItemReqDto): Promise<DeleteItemResDto> {
    // check if groupId is provided
    AppService.validateGroupId(reqDto.groupId);

    // check if itemId is provided
    ItemsService.validateItemId(reqDto.id);

    // find the item
    const item = await this.itemRepo.findOneBy({
      id: reqDto.id,
      groupProduct: {
        group: {
          id: reqDto.groupId,
        },
      },
      timestamp: {
        deletedAt: IsNull(),
      },
    });

    if (!item) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Item not found',
      };
    }

    const deleteResult = await this.itemRepo.softDelete({
      id: item.id,
    });

    if (deleteResult.affected === 0) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Item not found',
      };
    } else {
      return {
        statusCode: HttpStatus.OK,
        message: 'Delete item successfully',
      };
    }
  }

  /**
   * Restores a soft-deleted item.
   * @param reqDto The DTO containing the information needed to restore the item.
   * @returns The DTO containing the result of the restore operation.
   * @throws RpcException if the item does not exist or if the restore fails.
   */
  async restore(reqDto: RestoreItemReqDto): Promise<RestoreItemResDto> {
    // check if groupId is provided
    AppService.validateGroupId(reqDto.groupId);

    // check if itemId is provided
    ItemsService.validateItemId(reqDto.id);

    // find the item
    const item = await this.itemRepo.findOne({
      where: {
        id: reqDto.id,
        groupProduct: {
          group: {
            id: reqDto.groupId,
          },
        },
        timestamp: {
          deletedAt: Not(IsNull()),
        },
      },
      withDeleted: true,
    });

    if (!item) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Item not found',
      };
    }

    const restoreResult = await this.itemRepo.restore({
      id: item.id,
    });

    if (restoreResult.affected === 0) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Item not found',
      };
    } else {
      return {
        statusCode: HttpStatus.OK,
        message: 'Restore item successfully',
      };
    }
  }
}
