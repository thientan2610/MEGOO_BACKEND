import { PurchaseLocationDto } from 'libs/shared/src/lib/dto/prod-mgmt/dto/purchase-location.dto';
import {
  CreatePurchaseLocationReqDto,
  CreatePurchaseLocationResDto,
  DeletePurchaseLocationReqDto,
  DeletePurchaseLocationResDto,
  GetPurchaseLocationByIdReqDto,
  GetPurchaseLocationByIdResDto,
  GetPurchaseLocationsPaginatedReqDto,
  RestorePurchaseLocationReqDto,
  RestorePurchaseLocationResDto,
  UpdatePurchaseLocationReqDto,
  UpdatePurchaseLocationResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/locations';
import { paginate } from 'nestjs-paginate';
import { IsNull, Not, Repository } from 'typeorm';

import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';

import { AppService } from '../app/app.service';
import { GroupEntity } from '../entities/group.entity';
import { PurchaseLocationEntity } from '../entities/purchase-location.entity';
import { purchaseLocationsPaginateConfig } from './paginate-config/pagination.config';

@Injectable()
export class PurchaseLocationsService {
  constructor(
    @InjectRepository(PurchaseLocationEntity)
    private readonly purchaseLocationRepo: Repository<PurchaseLocationEntity>,

    @InjectRepository(GroupEntity)
    private readonly groupRepo: Repository<GroupEntity>,
  ) {}

  /**
   * Converts a PurchaseLocationEntity to a PurchaseLocationDto.
   * @param purchaseLocation The PurchaseLocationEntity to convert.
   * @param addGroup Whether or not to include the group in the resulting PurchaseLocationDto.
   * @returns The resulting PurchaseLocationDto.
   */
  public static toDto(
    purchaseLocation: PurchaseLocationEntity,
    addGroup = false,
  ): PurchaseLocationDto {
    const dto: PurchaseLocationDto = {
      id: purchaseLocation.id,
      name: purchaseLocation.name,
      address: purchaseLocation.address,
      addedBy: purchaseLocation.addedBy,
      image: purchaseLocation.image,
      description: purchaseLocation.description,
      timestamp: purchaseLocation.timestamp,
    };

    if (addGroup) {
      dto['group'] = {
        id: purchaseLocation.group.id,
        timestamp: purchaseLocation.group.timestamp,
      };
    }

    return dto;
  }

  /**
   * Validates the given purchase location ID.
   * @param id The ID to validate.
   * @throws RpcException with status code 400 if the ID is falsy.
   */
  private static validatePurchaseLocationId(id: string) {
    if (!id) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Group ID is required',
        data: undefined,
      });
    }
  }

  /**
   * Creates a new purchase location with the given information.
   * @param createPurchaseLocation The information of the purchase location to create.
   * @returns A Promise of the created purchase location.
   */
  async createPurchaseLocation(
    createPurchaseLocation: CreatePurchaseLocationReqDto,
  ): Promise<CreatePurchaseLocationResDto> {
    // check if group id is provided
    AppService.validateGroupId(createPurchaseLocation.groupId);

    const group = await this.groupRepo.findOneBy({
      id: createPurchaseLocation.groupId,
    });

    if (!group) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Group id is invalid - group not found',
      };
    }

    const purchaseLocation = this.purchaseLocationRepo.create({
      id: createPurchaseLocation.id,
      name: createPurchaseLocation.name,
      address: createPurchaseLocation.address,
      addedBy: createPurchaseLocation.addedBy,
      group: group,
    });

    await this.purchaseLocationRepo.save(purchaseLocation);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Purchase location created',
      data: PurchaseLocationsService.toDto(purchaseLocation),
    };
  }

  /**
   * Retrieves a purchase location by its ID.
   * @param id The ID of the purchase location to retrieve.
   * @returns A Promise of the retrieved purchase location.
   * If the purchase location is not found, returns a 404 status code with a message.
   */
  async getPurchaseLocationById({
    groupId,
    id,
  }: GetPurchaseLocationByIdReqDto): Promise<GetPurchaseLocationByIdResDto> {
    // check if group id is provided
    AppService.validateGroupId(groupId);

    const purchaseLocation = await this.purchaseLocationRepo.findOneBy({
      id,
      group: {
        id: groupId,
      },
    });

    if (!purchaseLocation) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Purchase location not found',
      };
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Purchase location found',
      data: PurchaseLocationsService.toDto(purchaseLocation),
    };
  }

  /**
   * Retrieves a paginated list of purchase locations for a given group ID.
   * @param reqDto The request DTO containing pagination information and the group ID.
   * @returns A Promise of the paginated list of purchase locations.
   */
  async getPurchaseLocationsPaginated(
    reqDto: GetPurchaseLocationsPaginatedReqDto,
  ) {
    // check if group id is provided
    AppService.validateGroupId(reqDto.groupId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Get purchase locations paginated successfully',
      ...(await paginate(reqDto, this.purchaseLocationRepo, {
        ...purchaseLocationsPaginateConfig,
        where: {
          group: {
            id: reqDto.groupId,
          },
        },
      })),
    };
  }

  /**
   * Deletes a purchase location with the given ID and group ID.
   * @param reqDto The request DTO containing the ID of the purchase location and the ID of the group it belongs to.
   * @returns A Promise of the result of the deletion operation.
   * If the purchase location is not found, returns a 404 status code with a message.
   */
  async deletePurchaseLocation({
    groupId,
    id,
  }: DeletePurchaseLocationReqDto): Promise<DeletePurchaseLocationResDto> {
    // check if group id is provided
    AppService.validateGroupId(groupId);

    // check if purchase location id is provided
    PurchaseLocationsService.validatePurchaseLocationId(id);

    const deleteResult = await this.purchaseLocationRepo.softDelete({
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
        message: 'Purchase location not found',
      };
    } else {
      return {
        statusCode: HttpStatus.OK,
        message: 'Delete purchase location  successfully',
      };
    }
  }

  /**
   * Restores a soft-deleted purchase location with the given ID and group ID.
   * @param reqDto The request DTO containing the ID of the purchase location and the ID of the group it belongs to.
   * @returns A Promise of the result of the restoration operation.
   * If the purchase location is not found, returns a 404 status code with a message.
   */
  async restorePurchaseLocation({
    groupId,
    id,
  }: RestorePurchaseLocationReqDto): Promise<RestorePurchaseLocationResDto> {
    // check if group id is provided
    AppService.validateGroupId(groupId);

    // check if purchase location id is provided
    PurchaseLocationsService.validatePurchaseLocationId(id);

    const restoreResult = await this.purchaseLocationRepo.restore({
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
        message: 'Purchase location  not found',
      };
    } else {
      return {
        statusCode: HttpStatus.OK,
        message: 'Restore purchase location successfully',
      };
    }
  }

  /**
   * Updates a purchase location with the given ID and group ID.
   * @param reqDto The request DTO containing the ID of the purchase location, the ID of the group it belongs to, and the updated information.
   * @returns A Promise of the result of the update operation.
   * If the purchase location is not found, returns a 404 status code with a message.
   * If the update operation fails, returns a 500 status code with an error message.
   */
  async updatePurchaseLocation(
    reqDto: UpdatePurchaseLocationReqDto,
  ): Promise<UpdatePurchaseLocationResDto> {
    // check if group id is provided
    AppService.validateGroupId(reqDto.groupId);

    // check if purchase location id is provided
    PurchaseLocationsService.validatePurchaseLocationId(reqDto.id);

    const groupId = reqDto.groupId;
    const id = reqDto.id;

    // remove group id and id from the request dto to prevent updating them
    delete reqDto.groupId;
    delete reqDto.id;

    const purchaseLocation = await this.purchaseLocationRepo.findOneBy({
      id,
      group: {
        id: groupId,
      },
    });

    if (!purchaseLocation) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Purchase location not found',
      };
    }

    // for each exist field, update it in the group product if this key also exist in group product
    for (const key in reqDto) {
      if (reqDto[key] && purchaseLocation[key]) {
        purchaseLocation[key] = reqDto[key];
      }
    }

    // save the updated group product
    try {
      await this.purchaseLocationRepo.save(purchaseLocation);
    } catch (error) {
      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Update purchase location failed',
        data: error?.data || undefined,
      });
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Update purchase location successfully',
      data: PurchaseLocationsService.toDto(purchaseLocation),
    };
  }
}
