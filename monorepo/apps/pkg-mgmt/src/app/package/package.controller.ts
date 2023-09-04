import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PackageService } from './package.service';
import {
  BaseResDto,
  CreatePkgReqDto,
  GetPkgResDto,
  IdDto,
  kafkaTopic,
  PackageDto,
  UpdatePkgReqDto,
} from '@nyp19vp-be/shared';
import {
  CollectionDto,
  CollectionResponse,
} from '@forlagshuset/nestjs-mongoose-paginate';
import { Types } from 'mongoose';

@Controller()
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @MessagePattern(kafkaTopic.PKG_MGMT.PACKAGE.CREATE)
  create(@Payload() createPkgReqDto: CreatePkgReqDto): Promise<BaseResDto> {
    return this.packageService.create(createPkgReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.PACKAGE.GET)
  find(
    @Payload() collectionDto: CollectionDto,
  ): Promise<CollectionResponse<PackageDto>> {
    return this.packageService.find(collectionDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.PACKAGE.GET_DELETED)
  findWithDeleted(@Payload() req): Promise<PackageDto[]> {
    return this.packageService.findWithDeleted(req);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.PACKAGE.GET_BY_ID)
  findById(@Payload() id: Types.ObjectId): Promise<GetPkgResDto> {
    return this.packageService.findById(id);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.PACKAGE.UPDATE)
  update(@Payload() updatePkgReqDto: UpdatePkgReqDto): Promise<BaseResDto> {
    return this.packageService.update(updatePkgReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.PACKAGE.DELETE)
  remove(@Payload() id: Types.ObjectId): Promise<BaseResDto> {
    return this.packageService.remove(id);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.PACKAGE.RESTORE)
  restore(@Payload() id: Types.ObjectId): Promise<BaseResDto> {
    return this.packageService.restore(id);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.PACKAGE.GET_MANY)
  async findMany(@Payload() list_id: IdDto[]): Promise<PackageDto[]> {
    return await this.packageService.findMany(list_id);
  }
}
