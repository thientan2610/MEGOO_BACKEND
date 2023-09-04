import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
  Req,
} from '@nestjs/common';
import { PackageService } from './package.service';
import {
  BaseResDto,
  CreatePkgReqDto,
  GetPkgResDto,
  PackageDto,
  ParseObjectIdPipe,
  PkgCollectionProperties,
  UpdatePkgReqDto,
} from '@nyp19vp-be/shared';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  CollectionDto,
  CollectionResponse,
  ValidationPipe,
} from '@forlagshuset/nestjs-mongoose-paginate';
import { Types } from 'mongoose';

@ApiTags('Package Management/Package')
@Controller('pkg-mgmt/pkg')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Created Package', type: BaseResDto })
  create(@Body() createPkgReqDto: CreatePkgReqDto): Promise<BaseResDto> {
    console.log('createPkg', createPkgReqDto);
    return this.packageService.create(createPkgReqDto);
  }

  @Get()
  @ApiOkResponse({ description: 'Got All Packages', type: PackageDto })
  @ApiOperation({
    description:
      'Filter MUST:\n\n\t- name(optional): {"name":{"$regex":"(?i)(<keyword>)(?-i)"}}\n\n\t- duration(optional):\n\n\t\t- type: integer\n\n\t\t- unit: date\n\n\t\t- example: {"duration":30}\n\n\t- noOfMember:\n\n\t\t- type: integer\n\n\t\t- description: Maximum number of members in group\n\n\t\t- example: {"noOfMember":3}\n\n\t- price(optional):\n\n\t\t- type: float \n\n\t\t- lower bound price: {price: {$gte: 25}}\n\n\t\t- upper bound price: {price: {$lte: 90}}\n\n\t\t- example: 25000 < price < 100000 => {"price": {"$gte": 25, "$lte": 100}}',
  })
  find(
    @Query(new ValidationPipe(PkgCollectionProperties))
    collectionDto: CollectionDto,
  ): Promise<CollectionResponse<PackageDto>> {
    console.log('get all packages');
    console.log(collectionDto);
    return this.packageService.find(collectionDto);
  }

  @Get('all')
  findWithDeleted(@Req() req: Request): Promise<PackageDto[]> {
    console.log('get all packages with deleted');
    return this.packageService.findWithDeleted(req);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Got Package', type: GetPkgResDto })
  @ApiParam({ name: 'id', type: String })
  findById(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
  ): Promise<GetPkgResDto> {
    console.log(`get package #${id}`);
    return this.packageService.findById(id);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Deleted Package', type: BaseResDto })
  @ApiParam({ name: 'id', type: String })
  remove(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
  ): Promise<BaseResDto> {
    console.log(`delete package #${id}`);
    return this.packageService.remove(id);
  }

  @Patch(':id')
  @ApiOkResponse({
    description: 'Restore deleted package',
    type: BaseResDto,
  })
  @ApiParam({ name: 'id', type: String })
  restore(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
  ): Promise<BaseResDto> {
    console.log(`delete package #${id}`);
    return this.packageService.restore(id);
  }

  @Put(':id')
  @ApiOkResponse({ description: 'Updated Package', type: BaseResDto })
  update(
    @Param('id') id: string,
    @Body() updatePkgReqDto: UpdatePkgReqDto,
  ): Promise<BaseResDto> {
    console.log(`update package #${id}`, updatePkgReqDto);
    updatePkgReqDto._id = id;
    return this.packageService.update(updatePkgReqDto);
  }
}
