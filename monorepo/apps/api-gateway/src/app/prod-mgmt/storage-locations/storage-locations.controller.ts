import { UploadApiOptions } from 'cloudinary';
import { randomUUID } from 'crypto';
import {
  storageLocationsFilterableColumns,
  storageLocationsSearchableColumns,
  storageLocationsSortableColumns,
} from 'libs/shared/src/lib/config';
import { StorageLocationDto } from 'libs/shared/src/lib/dto/prod-mgmt/dto/storage-location.dto';
import {
  CreateStorageLocationReqDto,
  CreateStorageLocationResDto,
  DeleteStorageLocationResDto,
  GetStorageLocationByIdResDto,
  GetStorageLocationsPaginatedResDto,
  RestoreStorageLocationResDto,
  UpdateStorageLocationReqDto,
  UpdateStorageLocationResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/locations';
import { CloudinaryService } from 'nestjs-cloudinary';
import { Paginate, PaginateQuery } from 'nestjs-paginate';

import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PaginateQueryOptions } from '@nyp19vp-be/shared';

import { uploadImage } from '../utils/cld';
import { StorageLocationsService } from './storage-locations.service';

@ApiTags('route: prod-mgmt', 'route: prod-mgmt/storage-locations')
@Controller('prod-mgmt/storage-locations')
export class StorageLocationsController {
  private static uploadOptions: UploadApiOptions = {
    folder: 'storage-locations/',
    format: 'png',
  };

  constructor(
    private readonly storageLocationsService: StorageLocationsService,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @ApiOperation({
    summary:
      'Create storage location - [MULTIPART/FORM-DATA] and [JSON] are supported',
    description: `Create storage location.
    **image** has high priority than **file**. \n
    If both of **image** and **file** was provided, **image** would be chosen.
    If none of both was provided or invalid, default image will be chosen.
    **IMPORTANT**: Idk why **multipart/form-data** could not send http via Swagger UI, please use Postman instead`,
  })
  @ApiCreatedResponse({
    description: 'Create storage location',
    type: CreateStorageLocationResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when create storage location. Reason:
    - Invalid group id`,
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when create storage location. Reason:
    - Timeout when connect to database
    - Timeout when connect to kafka microservice`,
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @Post()
  async createStorageLocation(
    @Body() reqDto: CreateStorageLocationReqDto,
    @UploadedFile(
      'file',
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
  ): Promise<CreateStorageLocationResDto> {
    const id = randomUUID();
    let imageUrl = undefined;
    if (reqDto.image) {
      imageUrl = await uploadImage(
        this.cloudinaryService,
        StorageLocationsController.uploadOptions,
        reqDto.image,
        id,
      );
    } else if (file) {
      imageUrl = await uploadImage(
        this.cloudinaryService,
        StorageLocationsController.uploadOptions,
        file,
        id,
      );
    }

    return this.storageLocationsService.createStorageLocation({
      ...reqDto,
      id,
      image: imageUrl,
      file: undefined,
    });
  }

  @ApiOperation({
    summary: 'Get storage location by id',
    description: 'Get storage location by id',
  })
  @ApiOkResponse({
    description: 'Get storage location by id',
    type: GetStorageLocationByIdResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when get storage location by id. Reason:
    - Invalid storage location id,
    - Invalid group id`,
  })
  @ApiNotFoundResponse({
    description:
      'Storage location not found. Reason: The storage location id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when get storage location by id. Reason:
    - Timeout when connect to database
    - Timeout when connect to kafka microservice`,
  })
  @ApiParam({
    name: 'groupId',
    description: 'The group id',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'The group product id',
    type: String,
  })
  @Get('/:groupId/:id')
  async getStorageLocationById(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
  ): Promise<GetStorageLocationByIdResDto> {
    return this.storageLocationsService.getStorageLocationById(groupId, id);
  }

  @ApiOperation({
    summary: 'Get **PAGINATED** storage locations',
    description: 'Get **PAGINATED** storage locations',
  })
  @PaginateQueryOptions(
    StorageLocationDto,
    storageLocationsSearchableColumns,
    storageLocationsSortableColumns,
    storageLocationsFilterableColumns,
  )
  @Get('/:groupId')
  async getStorageLocationsPaginated(
    @Paginate() query: PaginateQuery,
    @Param('groupId') groupId: string,
  ): Promise<GetStorageLocationsPaginatedResDto> {
    return this.storageLocationsService.getStorageLocationsPaginated(
      query,
      groupId,
    );
  }

  @ApiOperation({
    summary: 'Delete storage location by id',
    description: 'Delete storage location by id',
  })
  @ApiOkResponse({
    description: 'Delete storage location by id',
    type: DeleteStorageLocationResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when delete storage location by id. Reason:
    - Invalid storage location id,
    - Invalid group id`,
  })
  @ApiNotFoundResponse({
    description:
      'Storage location not found. Reason: The storage location id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when delete storage location by id. Reason:
    - Timeout when connect to database
    - Timeout when connect to kafka microservice`,
  })
  @ApiParam({
    name: 'groupId',
    description: 'The group id',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'The storage location id',
    type: String,
  })
  @Delete('/:groupId/:id')
  async deleteStorageLocation(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
  ): Promise<DeleteStorageLocationResDto> {
    return this.storageLocationsService.deleteStorageLocation(groupId, id);
  }

  @ApiOperation({
    summary: 'Restore storage location by id',
    description: 'Restore storage location by id',
  })
  @ApiOkResponse({
    description: 'Restore storage location by id',
    type: RestoreStorageLocationResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when restore storage location by id. Reason:
    - Invalid storage location id,
    - Invalid group id`,
  })
  @ApiNotFoundResponse({
    description:
      'Storage location not found. Reason: The storage location id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when restore storage location by id. Reason:
    - Timeout when connect to database
    - Timeout when connect to kafka microservice`,
  })
  @ApiParam({
    name: 'groupId',
    description: 'The group id',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'The storage location id',
    type: String,
  })
  @Patch('/:groupId/:id')
  async restoreStorageLocation(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
  ): Promise<RestoreStorageLocationResDto> {
    return this.storageLocationsService.restoreStorageLocation(groupId, id);
  }

  @ApiOperation({
    summary:
      'Update storage location by id - [MULTIPART/FORM-DATA] and [JSON] are supported',
    description: `Update storage location by id.
    **image** has high priority than **file**.
    If both of **image** and **file** was provided, **image** would be chosen. \n
    If none of both was provided or invalid, default image will be chosen.
    **IMPORTANT**: Idk why **multipart/form-data** could not send http via Swagger UI, please use Postman instead`,
  })
  @ApiOkResponse({
    description: 'Update storage location by id',
    type: UpdateStorageLocationResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when update storage location by id. Reason:
    - Invalid storage location id,
    - Invalid group id`,
  })
  @ApiNotFoundResponse({
    description:
      'Storage location not found. Reason: The storage location id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when update storage location by id. Reason:
    - Timeout when connect to database
    - Timeout when connect to kafka microservice`,
  })
  @ApiParam({
    name: 'groupId',
    description: 'The group id',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'The storage location id',
    type: String,
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('file'))
  @Put('/:groupId/:id')
  async updateStorageLocation(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @Body() reqDto: UpdateStorageLocationReqDto,
    @UploadedFile(
      'file',
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
  ): Promise<UpdateStorageLocationResDto> {
    let imageUrl = undefined;
    if (reqDto.image) {
      imageUrl = await uploadImage(
        this.cloudinaryService,
        StorageLocationsController.uploadOptions,
        reqDto.image,
        id,
      );
    } else if (file) {
      imageUrl = await uploadImage(
        this.cloudinaryService,
        StorageLocationsController.uploadOptions,
        file,
        id,
      );
    }

    return this.storageLocationsService.updateStorageLocation(groupId, id, {
      ...reqDto,
      image: imageUrl,
      file: undefined,
    });
  }
}
