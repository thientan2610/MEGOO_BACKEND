import { UploadApiOptions } from 'cloudinary';
import { randomUUID } from 'crypto';
import {
  newGroupProductsFilteredColumns,
  newGroupProductsSearchableColumns,
  newGroupProductsSortableColumns,
} from 'libs/shared/src/lib/config/prod-mgmt';
import { NewGroupProductDto } from 'libs/shared/src/lib/dto/prod-mgmt/dto/new-group-product.dto';
import {
  CreateNewGroupProductReqDto,
  CreateNewGroupProductResDto,
  DeleteNewGroupProductResDto,
  GetNewGroupProductByIdResDto,
  GetNewGroupProductsPaginatedResDto,
  RestoreNewGroupProductResDto,
  UpdateNewGroupProductReqDto,
  UpdateNewGroupProductResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/new-group-products';
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
import { NewGroupProductsService } from './new-group-products.service';

@ApiTags('route: prod-mgmt', 'route: prod-mgmt/new-group-products')
@Controller('prod-mgmt/new-group-products')
export class NewGroupProductsController {
  private static uploadOptions: UploadApiOptions = {
    folder: 'new-group-products/',
    format: 'png',
  };

  constructor(
    private readonly newGroupProductsService: NewGroupProductsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @ApiOperation({
    summary:
      'Create NEW group product - [MULTIPART/FORM-DATA] and [JSON] are supported',
    description: `Create NEW group product.
    **image** has high priority than **file**.
    If both of **image** and **file** was provided, **image** would be chosen.
    If none of both was provided or invalid, default image will be chosen.
    **IMPORTANT**: Idk why **multipart/form-data** could not send http via Swagger UI, please use Postman instead.`,
  })
  @ApiCreatedResponse({
    description: 'Create NEW group product',
    type: CreateNewGroupProductResDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad request when create NEW group product.',
  })
  @ApiNotFoundResponse({
    description: 'Group not found',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when create NEW group product. Reason:
    - Duplicate barcode
    - Timeout when connect to database
    - Timeout when connect to kafka microservice`,
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @Post()
  async createNewGroupProduct(
    @Body() reqDto: CreateNewGroupProductReqDto,
    @UploadedFile(
      'file',
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
  ) {
    const id = randomUUID();
    let imageUrl = undefined;
    if (reqDto.image) {
      imageUrl = await uploadImage(
        this.cloudinaryService,
        NewGroupProductsController.uploadOptions,
        reqDto.image,
        id,
      );
    } else if (file) {
      imageUrl = await uploadImage(
        this.cloudinaryService,
        NewGroupProductsController.uploadOptions,
        file,
        id,
      );
    }

    return this.newGroupProductsService.createNewGroupProduct({
      ...reqDto,
      id: id,
      image: imageUrl,
      file: undefined,
    });
  }

  @ApiOperation({
    summary: 'Get NEW group product by id',
    description: 'Get NEW group product by id',
  })
  @ApiOkResponse({
    description: 'Get NEW group product by id',
    type: GetNewGroupProductByIdResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when get NEW group product by id. Reason: 
    - Invalid NEW group product id
    - Invalid group id`,
  })
  @ApiNotFoundResponse({
    description:
      'Group product not found. Reason: The NEW group product id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when get NEW group product by id. Reason:
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
    description: 'The NEW group product id',
    type: String,
  })
  @Get(':groupId/:id')
  getNewGroupProductById(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
  ) {
    return this.newGroupProductsService.getNewGroupProductById(groupId, id);
  }

  @ApiOperation({
    summary: 'Get **PAGINATED** NEW group products',
    description: 'Get **PAGINATED** NEW group products',
  })
  @PaginateQueryOptions(
    NewGroupProductDto,
    newGroupProductsSearchableColumns,
    newGroupProductsSortableColumns,
    newGroupProductsFilteredColumns,
  )
  @Get(':groupId')
  getNewGroupProducts(
    @Paginate() query: PaginateQuery,
    @Param('groupId') groupId: string,
  ): Promise<GetNewGroupProductsPaginatedResDto> {
    return this.newGroupProductsService.getNewGroupProductsPaginated(
      query,
      groupId,
    );
  }

  @ApiOperation({
    summary: 'Delete NEW group product by id',
    description: 'Delete NEW group product by id',
  })
  @ApiOkResponse({
    description: 'Delete NEW group product by id',
    type: DeleteNewGroupProductResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when get NEW group product by id. Reason: 
    - Invalid NEW group product id
    - Invalid group id`,
  })
  @ApiNotFoundResponse({
    description:
      'Group product not found. Reason: The NEW group product id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when delete NEW group product by id. Reason:
    - Timeout when connect to database
    - Timeout when connect to kafka microservice`,
  })
  @ApiParam({
    name: 'groupId',
    description: 'The id of the group',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'The id of the NEW group product',
    type: String,
  })
  @Delete(':groupId/:id')
  deleteNewGroupProduct(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
  ) {
    return this.newGroupProductsService.deleteNewGroupProduct(groupId, id);
  }

  @ApiOperation({
    summary: 'Restore NEW group product by id',
    description: 'Restore NEW group product by id',
  })
  @ApiOkResponse({
    description: 'Restore NEW group product by id',
    type: RestoreNewGroupProductResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when get NEW group product by id. Reason: 
    - Invalid NEW group product id
    - Invalid group id`,
  })
  @ApiNotFoundResponse({
    description:
      'Group product not found. Reason: The NEW group product id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when restore NEW group product by id. Reason:
    - Timeout when connect to database
    - Timeout when connect to kafka microservice`,
  })
  @ApiParam({
    name: 'groupId',
    description: 'The id of the group',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'The id of the NEW group product',
    type: String,
  })
  @Patch(':groupId/:id')
  restoreNewGroupProduct(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
  ) {
    return this.newGroupProductsService.restoreNewGroupProduct(groupId, id);
  }

  @ApiOperation({
    summary:
      'Update NEW group product by id - [MULTIPART/FORM-DATA] and [JSON] are supported',
    description: `Update NEW group product by id.
    **image** has high priority than **file**.
    If both of **image** and **file** was provided, **image** would be chosen.
    If none of both was provided or invalid, default image will be chosen.
    **IMPORTANT**: Idk why **multipart/form-data** could not send http via Swagger UI, please use Postman instead.`,
  })
  @ApiOkResponse({
    description:
      'Update NEW group product by id - [MULTIPART/FORM-DATA] and [JSON] are supported',
    type: UpdateNewGroupProductResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when get NEW group product by id. Reason: 
    - Invalid NEW group product id
    - Invalid group id`,
  })
  @ApiNotFoundResponse({
    description:
      'Group product not found. Reason: The NEW group product id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when update NEW group product by id. Reason:
    - Timeout when connect to database
    - Timeout when connect to kafka microservice`,
  })
  @ApiParam({
    name: 'groupId',
    description: 'The id of the group',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'The id of the NEW group product',
    type: String,
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('file'))
  @Put(':groupId/:id')
  async updateNewGroupProduct(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @Body() reqDto: UpdateNewGroupProductReqDto,
    @UploadedFile(
      'file',
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
  ) {
    let imageUrl = undefined;
    if (reqDto.image) {
      imageUrl = await uploadImage(
        this.cloudinaryService,
        NewGroupProductsController.uploadOptions,
        reqDto.image,
        id,
      );
    } else if (file) {
      imageUrl = await uploadImage(
        this.cloudinaryService,
        NewGroupProductsController.uploadOptions,
        file,
        id,
      );
    }

    return this.newGroupProductsService.updateNewGroupProduct(groupId, id, {
      ...reqDto,
      image: imageUrl,
      file: undefined,
    });
  }
}
