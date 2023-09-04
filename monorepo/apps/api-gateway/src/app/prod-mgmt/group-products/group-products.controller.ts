import { UploadApiOptions } from 'cloudinary';
import { randomUUID } from 'crypto';
import {
  groupProductsFilteredColumns,
  groupProductsSearchableColumns,
  groupProductsSortableColumns,
} from 'libs/shared/src/lib/config/prod-mgmt';
import { GroupProductDto } from 'libs/shared/src/lib/dto/prod-mgmt/dto/group-product.dto';
import {
  CreateGroupProductReqDto,
  CreateGroupProductResDto,
  DeleteGroupProductResDto,
  GetGroupProductByIdResDto,
  GetGroupProductsPaginatedResDto,
  RestoreGroupProductResDto,
  UpdateGroupProductReqDto,
  UpdateGroupProductResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/products';
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
import { GroupProductsService } from './group-products.service';

@ApiTags('route: prod-mgmt', 'route: prod-mgmt/group-products')
@Controller('prod-mgmt/group-products')
export class GroupProductsController {
  private static uploadOptions: UploadApiOptions = {
    folder: 'group-products/',
    format: 'png',
  };

  constructor(
    private readonly groupProductsService: GroupProductsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @ApiOperation({
    summary:
      'Create group product - [MULTIPART/FORM-DATA] and [JSON] are supported',
    description: `Create group product.
    **image** has high priority than **file**.
    If both of **image** and **file** was provided, **image** would be chosen.
    If none of both was provided or invalid, default image will be chosen.
    **IMPORTANT**: Idk why **multipart/form-data** could not send http via Swagger UI, please use Postman instead.`,
  })
  @ApiCreatedResponse({
    description: 'Create group product',
    type: CreateGroupProductResDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad request when create group product.',
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
  async createGroupProduct(
    @Body() reqDto: CreateGroupProductReqDto,
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
        GroupProductsController.uploadOptions,
        reqDto.image,
        id,
      );
    } else if (file) {
      imageUrl = await uploadImage(
        this.cloudinaryService,
        GroupProductsController.uploadOptions,
        file,
        id,
      );
    }

    return this.groupProductsService.createGroupProduct({
      ...reqDto,
      id: id,
      image: imageUrl,
      file: undefined,
    });
  }

  @ApiOperation({
    summary: 'Get group product by id',
    description: 'Get group product by id',
  })
  @ApiOkResponse({
    description: 'Get group product by id',
    type: GetGroupProductByIdResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when get group product by id. Reason: 
    - Invalid group product id
    - Invalid group id`,
  })
  @ApiNotFoundResponse({
    description:
      'Group product not found. Reason: The group product id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when get group product by id. Reason:
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
  getGroupProductById(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
  ) {
    return this.groupProductsService.getGroupProductById(groupId, id);
  }

  @ApiOperation({
    summary: 'Get **PAGINATED** group products',
    description: 'Get **PAGINATED** group products',
  })
  @PaginateQueryOptions(
    GroupProductDto,
    groupProductsSearchableColumns,
    groupProductsSortableColumns,
    groupProductsFilteredColumns,
  )
  @Get(':groupId')
  getGroupProducts(
    @Paginate() query: PaginateQuery,
    @Param('groupId') groupId: string,
  ): Promise<GetGroupProductsPaginatedResDto> {
    return this.groupProductsService.getGroupProductsPaginated(query, groupId);
  }

  @ApiOperation({
    summary: 'Delete group product by id',
    description: 'Delete group product by id',
  })
  @ApiOkResponse({
    description: 'Delete group product by id',
    type: DeleteGroupProductResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when get group product by id. Reason: 
    - Invalid group product id
    - Invalid group id`,
  })
  @ApiNotFoundResponse({
    description:
      'Group product not found. Reason: The group product id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when delete group product by id. Reason:
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
    description: 'The id of the group product',
    type: String,
  })
  @Delete(':groupId/:id')
  deleteGroupProduct(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
  ) {
    return this.groupProductsService.deleteGroupProduct(groupId, id);
  }

  @ApiOperation({
    summary: 'Restore group product by id',
    description: 'Restore group product by id',
  })
  @ApiOkResponse({
    description: 'Restore group product by id',
    type: RestoreGroupProductResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when get group product by id. Reason: 
    - Invalid group product id
    - Invalid group id`,
  })
  @ApiNotFoundResponse({
    description:
      'Group product not found. Reason: The group product id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when restore group product by id. Reason:
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
    description: 'The id of the group product',
    type: String,
  })
  @Patch(':groupId/:id')
  restoreGroupProduct(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
  ) {
    return this.groupProductsService.restoreGroupProduct(groupId, id);
  }

  @ApiOperation({
    summary:
      'Update group product by id - [MULTIPART/FORM-DATA] and [JSON] are supported',
    description: `Update group product by id.
    **image** has high priority than **file**.
    If both of **image** and **file** was provided, **image** would be chosen.
    If none of both was provided or invalid, default image will be chosen.
    **IMPORTANT**: Idk why **multipart/form-data** could not send http via Swagger UI, please use Postman instead.`,
  })
  @ApiOkResponse({
    description:
      'Update group product by id - [MULTIPART/FORM-DATA] and [JSON] are supported',
    type: UpdateGroupProductResDto,
  })
  @ApiBadRequestResponse({
    description: `Bad request when get group product by id. Reason: 
    - Invalid group product id
    - Invalid group id`,
  })
  @ApiNotFoundResponse({
    description:
      'Group product not found. Reason: The group product id does not exist',
  })
  @ApiInternalServerErrorResponse({
    description: `Internal server error when update group product by id. Reason:
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
    description: 'The id of the group product',
    type: String,
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('file'))
  @Put(':groupId/:id')
  async updateGroupProduct(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @Body() reqDto: UpdateGroupProductReqDto,
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
        GroupProductsController.uploadOptions,
        reqDto.image,
        id,
      );
    } else if (file) {
      imageUrl = await uploadImage(
        this.cloudinaryService,
        GroupProductsController.uploadOptions,
        file,
        id,
      );
    }

    return this.groupProductsService.updateGroupProduct(groupId, id, {
      ...reqDto,
      image: imageUrl,
      file: undefined,
    });
  }
}
