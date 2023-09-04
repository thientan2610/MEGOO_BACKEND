import { NewGroupProductDto } from 'libs/shared/src/lib/dto/prod-mgmt/dto/new-group-product.dto';
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
import { PaginateConfig, paginate } from 'nestjs-paginate';
import { IsNull, Not, Repository } from 'typeorm';

import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';

import { AppService } from '../app/app.service';
import { GroupEntity } from '../entities/group.entity';
import { NewGroupProductEntity } from '../entities/new-group-product.entity';
import { newGroupProductsPaginateConfig } from './paginate-config/pagination.config';

import _ from 'lodash';

@Injectable()
export class NewGroupsProductsService {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly groupRepo: Repository<GroupEntity>,

    @InjectRepository(NewGroupProductEntity)
    private readonly newGroupProductRepo: Repository<NewGroupProductEntity>,
  ) {}

  /**
   * Converts a GroupEntity object to a NewGroupProductDto object.
   * @param newGroupProduct The GroupEntity object to be converted.
   * @returns A NewGroupProductDto object containing the converted properties.
   */
  public static toDto(
    newGroupProduct: NewGroupProductEntity,
  ): NewGroupProductDto {
    return {
      id: newGroupProduct?.id,
      description: newGroupProduct?.description,
      image: newGroupProduct?.image,
      name: newGroupProduct?.name,
      price: newGroupProduct?.price,
      bestBefore: newGroupProduct?.bestBefore,

      interval: newGroupProduct?.interval,
      intervalType: newGroupProduct?.intervalType,

      lastNotification: newGroupProduct?.lastNotification,
      nextNotification: newGroupProduct?.nextNotification,

      timestamp: newGroupProduct?.timestamp,
      group: {
        id: newGroupProduct?.group?.id,
        timestamp: newGroupProduct?.group?.timestamp,
      },
    };
  }

  /**
   * Validates the given product ID.
   * @param newGroupProductId The product ID to be validated.
   * @throws RpcException with status code HttpStatus.BAD_REQUEST and message 'Product ID is required' if the product ID is falsy.
   */
  private static validateNewGroupProductId(newGroupProductId: string) {
    if (!newGroupProductId) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Product ID is required',
      });
    }
  }

  /**
   * Creates a new NEW group product and adds it to the specified group.
   * @param reqDto The DTO containing the details of the new NEW group product.
   * @returns A DTO containing the details of the newly created NEW group product and the status code and message of the operation.
   * If the specified group does not exist, the status code will be HttpStatus.NOT_FOUND and the message will be 'Group not found'.
   * If the creation of the new NEW group product fails, the status code will be HttpStatus.INTERNAL_SERVER_ERROR and the message will be 'Create new NEW group product failed'.
   */
  async createNewGroupProduct(
    reqDto: CreateNewGroupProductReqDto,
  ): Promise<CreateNewGroupProductResDto> {
    // find group
    const group = await this.groupRepo.findOne({
      where: { id: reqDto.groupId },
    });

    // if group not exist, return error
    if (!group) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Group not found',
      };
    }

    // add newGroupProduct to group
    const newGroupProduct = this.newGroupProductRepo.create({
      id: reqDto.id,
      group: group,
      image: reqDto.image,
      name: reqDto.name,

      bestBefore: reqDto.bestBefore,

      price: reqDto.price,
      interval: reqDto.interval,
      intervalType: reqDto.intervalType,
      description: reqDto.description,
    });

    // update nextNotification
    newGroupProduct.applyDefaultInterval();
    newGroupProduct.updateNextNotification();

    try {
      await this.newGroupProductRepo.save(newGroupProduct);
    } catch (error) {
      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Create new NEW group product failed',
        data: error?.data || undefined,
      });
    }

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Create new NEW group product successfully',
      data: NewGroupsProductsService.toDto(newGroupProduct),
    };
  }

  /**
   * Retrieves a single NEW group product by its ID and group ID.
   * @param reqDto The DTO containing the IDs of the NEW group product and its parent group.
   * @returns A DTO containing the details of the retrieved NEW group product and the status code and message of the operation.
   * If the specified NEW group product does not exist, the status code will be HttpStatus.NOT_FOUND and the message will be 'Group product not found'.
   * If the request is missing either the group ID or NEW group product ID, the status code will be HttpStatus.BAD_REQUEST and the message will be 'Group id and NEW group product id are required'.
   */
  async getNewGroupProductById({
    id,
    groupId,
  }: GetNewGroupProductByIdReqDto): Promise<GetNewGroupProductByIdResDto> {
    // check if group id is provided
    AppService.validateGroupId(groupId);

    // check if NEW group product id is provided
    NewGroupsProductsService.validateNewGroupProductId(id);

    // find NEW group product
    const newGroupProduct = await this.newGroupProductRepo.findOneBy({
      id,
      group: {
        id: groupId,
      },
    });

    if (!newGroupProduct) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Group product not found',
      };
    } else {
      return {
        statusCode: HttpStatus.OK,
        message: 'Get NEW group product by id successfully',
        data: NewGroupsProductsService.toDto(newGroupProduct),
      };
    }
  }

  /**
   * Retrieves a paginated list of NEW group products based on the provided request DTO.
   * @param reqDto The DTO containing the pagination and filtering options.
   * @returns A DTO containing the paginated list of NEW group products and the status code and message of the operation.
   */
  async getNewGroupProductsPaginated(
    reqDto: GetNewGroupProductsPaginatedReqDto,
  ) {
    const qb = this.newGroupProductRepo
      .createQueryBuilder('newGroupProduct')
      .leftJoinAndMapOne(
        'newGroupProduct.group',
        GroupEntity,
        'group',
        'group.id = newGroupProduct.group_id',
      );

    const config: PaginateConfig<NewGroupProductEntity> = {
      ...newGroupProductsPaginateConfig,
      loadEagerRelations: true,
    };

    if (reqDto.groupId) {
      qb.where('newGroupProduct.group_id = :groupId', {
        groupId: reqDto.groupId,
      });
    }

    const paginatedResult = await paginate(reqDto, qb, config);

    console.log('paginatedResult', paginatedResult);

    return {
      statusCode: HttpStatus.OK,
      message: 'Get NEW group products paginated successfully',
      ...paginatedResult,
    };
  }

  /**
   * Deletes a NEW group product with the given ID.
   * @param reqDto The DTO containing the ID of the NEW group product to delete.
   * @returns A DTO containing the status code and message of the delete operation.
   */
  async deleteNewGroupProduct({
    id,
    groupId,
  }: DeleteNewGroupProductReqDto): Promise<DeleteNewGroupProductResDto> {
    // check if group id is provided
    AppService.validateGroupId(groupId);

    // check if NEW group product id is provided
    NewGroupsProductsService.validateNewGroupProductId(id);

    const deleteResult = await this.newGroupProductRepo.softDelete({
      id,
      group: {
        id: groupId,
      },
      timestamp: {
        deletedAt: IsNull(),
      },
    });

    if (deleteResult.affected === 0) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Group product not found',
      };
    } else {
      return {
        statusCode: HttpStatus.OK,
        message: 'Delete NEW group product successfully',
      };
    }
  }

  /**
   * Restores a soft-deleted NEW group product with the given ID.
   * @param reqDto The DTO containing the ID of the NEW group product to restore and its parent group ID.
   * @returns A DTO containing the status code and message of the restore operation.
   * If the specified NEW group product does not exist, the status code will be HttpStatus.NOT_FOUND and the message will be 'Group product not found'.
   * If the request is missing either the group ID or NEW group product ID, the status code will be HttpStatus.BAD_REQUEST and the message will be 'Group id and NEW group product id are required'.
   */
  async restoreNewGroupProduct({
    groupId,
    id,
  }: RestoreNewGroupProductReqDto): Promise<RestoreNewGroupProductResDto> {
    // check if group id is provided
    AppService.validateGroupId(groupId);

    // check if NEW group product id is provided
    NewGroupsProductsService.validateNewGroupProductId(id);

    const restoreResult = await this.newGroupProductRepo.restore({
      id,
      group: {
        id: groupId,
      },
      timestamp: {
        deletedAt: Not(IsNull()),
      },
    });

    if (restoreResult.affected === 0) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Group product not found',
      };
    } else {
      return {
        statusCode: HttpStatus.OK,
        message: 'Restore NEW group product successfully',
      };
    }
  }

  /**
   * Updates an existing NEW group product with the provided details.
   * @param reqDto The DTO containing the details of the NEW group product to update.
   * @returns A DTO containing the updated details of the NEW group product and the status code and message of the operation.
   * If the specified NEW group product does not exist, the status code will be HttpStatus.NOT_FOUND and the message will be 'Group product not found'.
   * If the update of the NEW group product fails, the status code will be HttpStatus.INTERNAL_SERVER_ERROR and the message will be 'Update NEW group product failed'.
   */
  async updateNewGroupProduct(
    reqDto: UpdateNewGroupProductReqDto,
  ): Promise<UpdateNewGroupProductResDto> {
    // check if group id is provided
    AppService.validateGroupId(reqDto.groupId);

    // check if NEW group product id is provided
    NewGroupsProductsService.validateNewGroupProductId(reqDto.id);

    const groupId = reqDto.groupId;
    const id = reqDto.id;

    // remove group id and id from the request dto to prevent updating them
    delete reqDto.groupId;
    delete reqDto.id;

    // find the NEW group product
    const newGroupProduct = await this.newGroupProductRepo.findOne({
      where: {
        id,
        group: {
          id: groupId,
        },
      },
    });

    if (!newGroupProduct) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Group product not found',
      };
    }

    // for each exist field, update it in the NEW group product if this key also exist in NEW group product
    for (const key in reqDto) {
      if (reqDto[key] && newGroupProduct[key]) {
        newGroupProduct[key] = reqDto[key];
      }
    }

    // save the updated NEW group product
    try {
      await this.newGroupProductRepo.save(newGroupProduct);
    } catch (error) {
      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Update NEW group product failed',
        data: error?.data || undefined,
      });
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Update NEW group product successfully',
      data: NewGroupsProductsService.toDto(newGroupProduct),
    };
  }

  async updateNextNotification(
    id: string,
  ): Promise<UpdateNewGroupProductResDto> {
    const newGp = await this.newGroupProductRepo.findOneBy({
      id: id,
    });

    if (!newGp) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Group product not found',
      };
    }

    newGp.updateNextNotification();

    try {
      await this.newGroupProductRepo.save(newGp);
    } catch (error) {
      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Update NEW group product failed',
        data: error?.data || undefined,
      });
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Update NEW group product successfully',
      data: NewGroupsProductsService.toDto(newGp),
    };
  }
}
