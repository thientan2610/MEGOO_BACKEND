import { StorageLocationDto } from 'libs/shared/src/lib/dto/prod-mgmt/dto/storage-location.dto';
import {
  CreateStorageLocationReqDto,
  CreateStorageLocationResDto,
  DeleteStorageLocationReqDto,
  DeleteStorageLocationResDto,
  GetStorageLocationByIdReqDto,
  GetStorageLocationByIdResDto,
  GetStorageLocationsPaginatedReqDto,
  RestoreStorageLocationReqDto,
  RestoreStorageLocationResDto,
  UpdateStorageLocationReqDto,
  UpdateStorageLocationResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/locations';
import { paginate } from 'nestjs-paginate';
import { IsNull, Not, Repository } from 'typeorm';

import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';

import { AppService } from '../app/app.service';
import { GroupEntity } from '../entities/group.entity';
import { StorageLocationEntity } from '../entities/storage-location.entity';
import { storageLocationsPaginateConfig } from './paginate-config/pagination.config';

@Injectable()
export class StorageLocationsService {
  constructor(
    @InjectRepository(StorageLocationEntity)
    private readonly storageLocationRepo: Repository<StorageLocationEntity>,

    @InjectRepository(GroupEntity)
    private readonly groupRepo: Repository<GroupEntity>,
  ) {}

  public static toDto(
    storageLocation: StorageLocationEntity,
    addGroup = false,
  ): StorageLocationDto {
    const dto: StorageLocationDto = {
      id: storageLocation.id,
      name: storageLocation.name,
      image: storageLocation.image,
      addedBy: storageLocation.addedBy,
      description: storageLocation.description,
      timestamp: storageLocation.timestamp,
    };

    if (addGroup) {
      dto['group'] = {
        id: storageLocation.group.id,
        timestamp: storageLocation.group.timestamp,
      };
    }

    return dto;
  }

  /**
   * Validates the given storage location ID.
   * @param id The storage location ID to validate.
   * @throws RpcException with BAD_REQUEST status code if the ID is not provided.
   */
  private static validateStorageLocationId(id: string) {
    if (!id) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Group ID is required',
        data: undefined,
      });
    }
  }

  /**
   * Creates a new storage location with the given details.
   * @param reqDto The details of the storage location to create.
   * @returns A Promise that resolves to a CreateStorageLocationResDto object containing the details of the created storage location.
   */
  async createStorageLocation(
    reqDto: CreateStorageLocationReqDto,
  ): Promise<CreateStorageLocationResDto> {
    // check if group id is provided
    AppService.validateGroupId(reqDto.groupId);

    const group = await this.groupRepo.findOneBy({
      id: reqDto.groupId,
    });

    if (!group) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Group id is invalid - group not found',
      };
    }

    const storageLocation = this.storageLocationRepo.create({
      id: reqDto.id,
      name: reqDto.name,
      image: reqDto.image,
      addedBy: reqDto.addedBy,
      description: reqDto.description,
      group: group,
    });

    try {
      await this.storageLocationRepo.save(storageLocation);
    } catch (err) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'Failed to create storage location',
      };
    }

    await this.storageLocationRepo.save(storageLocation);

    return {
      statusCode: HttpStatus.OK,
      message: 'Storage location found',
      data: StorageLocationsService.toDto(storageLocation),
    };
  }

  /**
   * Retrieves a storage location by ID.
   * @param id The ID of the storage location to retrieve.
   * @returns A Promise that resolves to a GetStorageLocationByIdResDto object containing the details of the retrieved storage location.
   * @throws RpcException with BAD_REQUEST status code if the ID is not provided.
   */
  async getStorageLocationById({
    groupId,
    id,
  }: GetStorageLocationByIdReqDto): Promise<GetStorageLocationByIdResDto> {
    // check if group id is provided
    AppService.validateGroupId(groupId);

    const storageLocation = await this.storageLocationRepo.findOneBy({
      id,
      group: {
        id: groupId,
      },
    });

    if (!storageLocation) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Storage location not found',
      };
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Storage location found',
      data: StorageLocationsService.toDto(storageLocation),
    };
  }

  /**
   * Retrieves a paginated list of storage locations for a given group.
   * @param reqDto The details of the request, including the group ID and pagination options.
   * @returns A Promise that resolves to a GetStorageLocationsPaginatedResDto object containing the paginated list of storage locations.
   */
  async getStorageLocationsPaginated(
    reqDto: GetStorageLocationsPaginatedReqDto,
  ) {
    // check if group id is provided
    AppService.validateGroupId(reqDto.groupId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Get group products paginated successfully',
      ...(await paginate(reqDto, this.storageLocationRepo, {
        ...storageLocationsPaginateConfig,
        where: {
          group: {
            id: reqDto.groupId,
          },
        },
      })),
    };
  }

  /**
   * Deletes a storage location by ID.
   * @param groupId The ID of the group that the storage location belongs to.
   * @param id The ID of the storage location to delete.
   * @returns A Promise that resolves to a DeleteStorageLocationResDto object containing the result of the delete operation.
   * @throws RpcException with BAD_REQUEST status code if the group ID or storage location ID is not provided.
   */
  async deleteStorageLocation({
    groupId,
    id,
  }: DeleteStorageLocationReqDto): Promise<DeleteStorageLocationResDto> {
    // check if group id is provided
    AppService.validateGroupId(groupId);

    // check if storage location id is provided
    StorageLocationsService.validateStorageLocationId(id);

    const deleteResult = await this.storageLocationRepo.softDelete({
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

  async restoreStorageLocation({
    groupId,
    id,
  }: RestoreStorageLocationReqDto): Promise<RestoreStorageLocationResDto> {
    // check if group id is provided
    AppService.validateGroupId(groupId);

    // check if storage location id is provided
    StorageLocationsService.validateStorageLocationId(id);

    const restoreResult = await this.storageLocationRepo.restore({
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

  async updateStorageLocation(
    reqDto: UpdateStorageLocationReqDto,
  ): Promise<UpdateStorageLocationResDto> {
    // check if group id is provided
    AppService.validateGroupId(reqDto.groupId);

    // check if storage location id is provided
    StorageLocationsService.validateStorageLocationId(reqDto.id);

    const groupId = reqDto.groupId;
    const id = reqDto.id;

    // remove group id and id from the request dto to prevent updating them
    delete reqDto.groupId;
    delete reqDto.id;

    const storageLocation = await this.storageLocationRepo.findOneBy({
      id,
      group: {
        id: groupId,
      },
    });

    if (!storageLocation) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Storage location not found',
      };
    }

    // for each exist field, update it in the group product if this key also exist in group product
    for (const key in reqDto) {
      if (reqDto[key] && storageLocation[key]) {
        storageLocation[key] = reqDto[key];
      }
    }

    // save the updated group product
    try {
      await this.storageLocationRepo.save(storageLocation);
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
      data: StorageLocationsService.toDto(storageLocation),
    };
  }
}
