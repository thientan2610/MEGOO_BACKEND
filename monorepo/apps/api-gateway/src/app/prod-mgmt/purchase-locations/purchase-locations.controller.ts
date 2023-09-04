import { UploadApiOptions } from 'cloudinary';
import { randomUUID } from 'crypto';
import {
  purchaseLocationsFilterableColumns,
  purchaseLocationsSearchableColumns,
  purchaseLocationsSortableColumns,
} from 'libs/shared/src/lib/config';
import { PurchaseLocationDto } from 'libs/shared/src/lib/dto/prod-mgmt/dto/purchase-location.dto';
import {
  CreatePurchaseLocationReqDto,
  CreatePurchaseLocationResDto,
  DeletePurchaseLocationResDto,
  GetPurchaseLocationByIdResDto,
  GetPurchaseLocationsPaginatedResDto,
  RestorePurchaseLocationResDto,
  UpdatePurchaseLocationReqDto,
  UpdatePurchaseLocationResDto,
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
import { PurchaseLocationsService } from './purchase-locations.service';

@ApiTags('route: prod-mgmt', 'route: prod-mgmt/purchase-locations')
@Controller('prod-mgmt/purchase-locations')
export class PurchaseLocationsController {
  private static uploadOptions: UploadApiOptions = {
    folder: 'purchase-locations/',
    format: 'png',
  };

  constructor(
    private readonly purchaseLocationsService: PurchaseLocationsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @ApiOperation({
    summary:
      'Create purchase location - [MULTIPART/FORM-DATA] and [JSON] are supported',
    description: `Create purchase location. \n
    **image** has high priority than **file**. \n
    If both of **image** and **file** was provided, **image** would be chosen. \n
    If none of both was provided or invalid, default image will be chosen.
    **IMPORTANT**: Idk why **multipart/form-data** could not send http via Swagger UI, please use Postman instead.`,
  })
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
    type: CreatePurchaseLocationResDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad request when create purchase location.',
  })
  @ApiNotFoundResponse({
    description: 'Group not found',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when create group product. Reason:
    - Duplicate barcode
    - Timeout when connect to database
    - Timeout when connect to kafka microservice`,
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @Post()
  async createPurchaseLocation(
    @Body() reqDto: CreatePurchaseLocationReqDto,
    @UploadedFile(
      'file',
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
  ): Promise<CreatePurchaseLocationResDto> {
    const id = randomUUID();
    let imageUrl = undefined;
    if (reqDto.image) {
      imageUrl = await uploadImage(
        this.cloudinaryService,
        PurchaseLocationsController.uploadOptions,
        reqDto.image,
        id,
      );
    } else if (file) {
      imageUrl = await uploadImage(
        this.cloudinaryService,
        PurchaseLocationsController.uploadOptions,
        file,
        id,
      );
    }

    return this.purchaseLocationsService.createPurchaseLocation({
      ...reqDto,
      id: id,
      image: imageUrl,
      file: undefined,
    });
  }

  @ApiOperation({
    summary: 'Get purchase location by id',
    description: 'Get purchase location by id',
  })
  @ApiOkResponse({
    description: 'Get purchase location by id',
    type: GetPurchaseLocationByIdResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when get purchase location by id. Reason:
    - Invalid purchase location id`,
  })
  @ApiNotFoundResponse({
    description:
      'Group product not found. Reason: The group product id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when get purchase location by id. Reason:
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
  @Get(':groupId/:id')
  async getPurchaseLocationById(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
  ): Promise<GetPurchaseLocationByIdResDto> {
    return this.purchaseLocationsService.getPurchaseLocationById(groupId, id);
  }

  @ApiOperation({
    summary: 'Get **PAGINATED** purchase locations',
    description: 'Get **PAGINATED** purchase locations',
  })
  @PaginateQueryOptions(
    PurchaseLocationDto,
    purchaseLocationsSearchableColumns,
    purchaseLocationsSortableColumns,
    purchaseLocationsFilterableColumns,
  )
  @Get('/:groupId')
  async getPurchaseLocationsPaginated(
    @Paginate() query: PaginateQuery,
    @Param('groupId') groupId: string,
  ): Promise<GetPurchaseLocationsPaginatedResDto> {
    return this.purchaseLocationsService.getPurchaseLocationsPaginated(
      query,
      groupId,
    );
  }

  @ApiOperation({
    summary: 'Delete purchase location by id',
    description: 'Delete purchase location by id',
  })
  @ApiOkResponse({
    description: 'Delete purchase location by id',
    type: DeletePurchaseLocationResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when delete purchase location by id. Reason:
    - Invalid purchase location id,
    - Invalid group id`,
  })
  @ApiNotFoundResponse({
    description:
      'Purchase location not found. Reason: The purchase location id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when delete purchase location by id. Reason:
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
    description: 'The purchase location id',
    type: String,
  })
  @Delete('/:groupId/:id')
  async deletePurchaseLocation(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
  ): Promise<DeletePurchaseLocationResDto> {
    return this.purchaseLocationsService.deletePurchaseLocation(groupId, id);
  }

  @ApiOperation({
    summary: 'Restore purchase location by id',
    description: 'Restore purchase location by id',
  })
  @ApiOkResponse({
    description: 'Restore purchase location by id',
    type: RestorePurchaseLocationResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when restore purchase location by id. Reason:
    - Invalid purchase location id,
    - Invalid group id`,
  })
  @ApiNotFoundResponse({
    description:
      'Purchase location not found. Reason: The purchase location id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when restore purchase location by id. Reason:
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
    description: 'The purchase location id',
    type: String,
  })
  @Patch('/:groupId/:id')
  async restorePurchaseLocation(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
  ): Promise<RestorePurchaseLocationResDto> {
    return this.purchaseLocationsService.restorePurchaseLocation(groupId, id);
  }

  @ApiOperation({
    summary:
      'Update purchase location by id - [MULTIPART/FORM-DATA] and [JSON] are supported',
    description: `Update purchase location by id.
    **image** has high priority than **file**.
    If both of **image** and **file** was provided, **image** would be chosen.
    If none of both was provided or invalid, default image will be chosen.
    **IMPORTANT**: Idk why **multipart/form-data** could not send http via Swagger UI, please use Postman instead`,
  })
  @ApiOkResponse({
    description: 'Update purchase location by id',
    type: UpdatePurchaseLocationResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when update purchase location by id. Reason:
    - Invalid purchase location id,
    - Invalid group id`,
  })
  @ApiNotFoundResponse({
    description:
      'Purchase location not found. Reason: The purchase location id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when update purchase location by id. Reason:
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
    description: 'The purchase location id',
    type: String,
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('file'))
  @Put('/:groupId/:id')
  async updatePurchaseLocation(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @Body() reqDto: UpdatePurchaseLocationReqDto,
    @UploadedFile(
      'file',
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
  ): Promise<UpdatePurchaseLocationResDto> {
    let imageUrl = undefined;
    if (reqDto.image) {
      imageUrl = await uploadImage(
        this.cloudinaryService,
        PurchaseLocationsController.uploadOptions,
        reqDto.image,
        id,
      );
    } else if (file) {
      imageUrl = await uploadImage(
        this.cloudinaryService,
        PurchaseLocationsController.uploadOptions,
        file,
        id,
      );
    }

    return this.purchaseLocationsService.updatePurchaseLocation(groupId, id, {
      ...reqDto,
      image: imageUrl,
      file: undefined,
    });
  }
}
