import { GroupProductDto } from 'libs/shared/src/lib/dto/prod-mgmt/dto/group-product.dto';
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
import { paginate } from 'nestjs-paginate';
import { IsNull, Not, Repository } from 'typeorm';

import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';

import { AppService } from '../app/app.service';
import { GroupProductEntity } from '../entities/group-product.entity';
import { GroupEntity } from '../entities/group.entity';
import { groupProductsPaginateConfig } from './paginate-config/pagination.config';

@Injectable()
export class GroupsProductsService {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly groupRepo: Repository<GroupEntity>,

    @InjectRepository(GroupProductEntity)
    private readonly groupProductRepo: Repository<GroupProductEntity>,
  ) {}

  /**
   * Converts a GroupEntity object to a GroupProductDto object.
   * @param groupProduct The GroupEntity object to be converted.
   * @returns A GroupProductDto object containing the converted properties.
   */
  public static toDto(groupProduct: GroupProductEntity): GroupProductDto {
    return {
      id: groupProduct.id,
      barcode: groupProduct.barcode,
      brand: groupProduct.brand,
      category: groupProduct.category,
      description: groupProduct.description,
      image: groupProduct.image,
      name: groupProduct.name,
      price: groupProduct.price,
      region: groupProduct.region,
      timestamp: groupProduct.timestamp,
    };
  }

  /**
   * Validates the given product ID.
   * @param groupProductId The product ID to be validated.
   * @throws RpcException with status code HttpStatus.BAD_REQUEST and message 'Product ID is required' if the product ID is falsy.
   */
  private static validateGroupProductId(groupProductId: string) {
    if (!groupProductId) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Product ID is required',
      });
    }
  }

  /**
   * Creates a new group product and adds it to the specified group.
   * @param reqDto The DTO containing the details of the new group product.
   * @returns A DTO containing the details of the newly created group product and the status code and message of the operation.
   * If the specified group does not exist, the status code will be HttpStatus.NOT_FOUND and the message will be 'Group not found'.
   * If the creation of the new group product fails, the status code will be HttpStatus.INTERNAL_SERVER_ERROR and the message will be 'Create new group product failed'.
   */
  async createGroupProduct(
    reqDto: CreateGroupProductReqDto,
  ): Promise<CreateGroupProductResDto> {
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

    // add groupProduct to group
    const groupProduct = this.groupProductRepo.create({
      id: reqDto.id,
      group: group,
      barcode: reqDto.barcode,
      brand: reqDto.brand,
      category: reqDto.category,
      description: reqDto.description,
      image: reqDto.image,
      name: reqDto.name,
      price: reqDto.price,
      region: reqDto.region,
    });

    try {
      await this.groupProductRepo.save(groupProduct);
    } catch (error) {
      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Create new group product failed',
        data: error?.data || undefined,
      });
    }

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Create new group product successfully',
      data: GroupsProductsService.toDto(groupProduct),
    };
  }

  /**
   * Retrieves a single group product by its ID and group ID.
   * @param reqDto The DTO containing the IDs of the group product and its parent group.
   * @returns A DTO containing the details of the retrieved group product and the status code and message of the operation.
   * If the specified group product does not exist, the status code will be HttpStatus.NOT_FOUND and the message will be 'Group product not found'.
   * If the request is missing either the group ID or group product ID, the status code will be HttpStatus.BAD_REQUEST and the message will be 'Group id and group product id are required'.
   */
  async getGroupProductById({
    id,
    groupId,
  }: GetGroupProductByIdReqDto): Promise<GetGroupProductByIdResDto> {
    // check if group id is provided
    AppService.validateGroupId(groupId);

    // check if group product id is provided
    GroupsProductsService.validateGroupProductId(id);

    // find group product
    const groupProduct = await this.groupProductRepo.findOne({
      where: {
        id,
        group: {
          id: groupId,
        },
      },
    });

    if (!groupProduct) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Group product not found',
      };
    } else {
      return {
        statusCode: HttpStatus.OK,
        message: 'Get group product by id successfully',
        data: GroupsProductsService.toDto(groupProduct),
      };
    }
  }

  /**
   * Retrieves a paginated list of group products based on the provided request DTO.
   * @param reqDto The DTO containing the pagination and filtering options.
   * @returns A DTO containing the paginated list of group products and the status code and message of the operation.
   */
  async getGroupProductsPaginated(reqDto: GetGroupProductsPaginatedReqDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Get group products paginated successfully',
      ...(await paginate(reqDto, this.groupProductRepo, {
        ...groupProductsPaginateConfig,
        where: {
          group: {
            id: reqDto.groupId,
          },
        },
      })),
    };
  }

  /**
   * Deletes a group product with the given ID.
   * @param reqDto The DTO containing the ID of the group product to delete.
   * @returns A DTO containing the status code and message of the delete operation.
   */
  async deleteGroupProduct({
    id,
    groupId,
  }: DeleteGroupProductReqDto): Promise<DeleteGroupProductResDto> {
    // check if group id is provided
    AppService.validateGroupId(groupId);

    // check if group product id is provided
    GroupsProductsService.validateGroupProductId(id);

    const deleteResult = await this.groupProductRepo.softDelete({
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
        message: 'Delete group product successfully',
      };
    }
  }

  /**
   * Restores a soft-deleted group product with the given ID.
   * @param reqDto The DTO containing the ID of the group product to restore and its parent group ID.
   * @returns A DTO containing the status code and message of the restore operation.
   * If the specified group product does not exist, the status code will be HttpStatus.NOT_FOUND and the message will be 'Group product not found'.
   * If the request is missing either the group ID or group product ID, the status code will be HttpStatus.BAD_REQUEST and the message will be 'Group id and group product id are required'.
   */
  async restoreGroupProduct({
    groupId,
    id,
  }: RestoreGroupProductReqDto): Promise<RestoreGroupProductResDto> {
    // check if group id is provided
    AppService.validateGroupId(groupId);

    // check if group product id is provided
    GroupsProductsService.validateGroupProductId(id);

    const restoreResult = await this.groupProductRepo.restore({
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
        message: 'Restore group product successfully',
      };
    }
  }

  /**
   * Updates an existing group product with the provided details.
   * @param reqDto The DTO containing the details of the group product to update.
   * @returns A DTO containing the updated details of the group product and the status code and message of the operation.
   * If the specified group product does not exist, the status code will be HttpStatus.NOT_FOUND and the message will be 'Group product not found'.
   * If the update of the group product fails, the status code will be HttpStatus.INTERNAL_SERVER_ERROR and the message will be 'Update group product failed'.
   */
  async updateGroupProduct(
    reqDto: UpdateGroupProductReqDto,
  ): Promise<UpdateGroupProductResDto> {
    // check if group id is provided
    AppService.validateGroupId(reqDto.groupId);

    // check if group product id is provided
    GroupsProductsService.validateGroupProductId(reqDto.id);

    const groupId = reqDto.groupId;
    const id = reqDto.id;

    // remove group id and id from the request dto to prevent updating them
    delete reqDto.groupId;
    delete reqDto.id;

    // find the group product
    const groupProduct = await this.groupProductRepo.findOne({
      where: {
        id,
        group: {
          id: groupId,
        },
      },
    });

    if (!groupProduct) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Group product not found',
      };
    }

    // for each exist field, update it in the group product if this key also exist in group product
    for (const key in reqDto) {
      if (reqDto[key] && groupProduct[key]) {
        groupProduct[key] = reqDto[key];
      }
    }

    // save the updated group product
    try {
      await this.groupProductRepo.save(groupProduct);
    } catch (error) {
      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Update group product failed',
        data: error?.data || undefined,
      });
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Update group product successfully',
      data: GroupsProductsService.toDto(groupProduct),
    };
  }
}
