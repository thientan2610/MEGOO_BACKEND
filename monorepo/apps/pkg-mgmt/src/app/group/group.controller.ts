import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GroupService } from './group.service';
import {
  AddGrMbReqDto,
  RmGrMbReqDto,
  CreateGrReqDto,
  GetGrResDto,
  GetGrsResDto,
  kafkaTopic,
  UpdateGrReqDto,
  UpdateGrPkgReqDto,
  GroupDto,
  UpdateAvatarReqDto,
  ActivateGrPkgReqDto,
  CheckGrSUReqDto,
  UpdateChannelReqDto,
  BaseResDto,
  PaginationParams,
  ProjectionParams,
  GetGrByExReqDto,
} from '@nyp19vp-be/shared';
import {
  CollectionDto,
  CollectionResponse,
} from '@forlagshuset/nestjs-mongoose-paginate';
import { Types } from 'mongoose';

@Controller()
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @MessagePattern(kafkaTopic.PKG_MGMT.GROUP.CREATE)
  create(@Payload() createGrReqDto: CreateGrReqDto): Promise<BaseResDto> {
    return this.groupService.create(createGrReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.GROUP.GET)
  find(
    @Payload() collectionDto: CollectionDto,
  ): Promise<CollectionResponse<GroupDto>> {
    return this.groupService.find(collectionDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.GROUP.GET_BY_ID)
  findById(
    @Payload() projectionParams: ProjectionParams,
  ): Promise<GetGrResDto> {
    return this.groupService.findById(projectionParams);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.GROUP.UPDATE)
  update(@Payload() updateGrReqDto: UpdateGrReqDto): Promise<BaseResDto> {
    return this.groupService.update(updateGrReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.GROUP.DELETE)
  remove(@Payload() id: Types.ObjectId): Promise<BaseResDto> {
    return this.groupService.remove(id);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.GROUP.RESTORE)
  restore(@Payload() id: Types.ObjectId): Promise<BaseResDto> {
    return this.groupService.restore(id);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.GROUP.ADD_MEMB)
  addMemb(@Payload() updateGrMbReqDto: AddGrMbReqDto): Promise<BaseResDto> {
    return this.groupService.addMemb(updateGrMbReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.GROUP.DEL_MEMB)
  rmMemb(@Payload() updateGrMbReqDto: RmGrMbReqDto): Promise<BaseResDto> {
    return this.groupService.rmMemb(updateGrMbReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.GROUP.ADD_PKG)
  addPkg(@Payload() updateGrPkgReqDto: UpdateGrPkgReqDto): Promise<BaseResDto> {
    return this.groupService.addPkg(updateGrPkgReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.GROUP.DEL_PKG)
  rmPkg(@Payload() updateGrPkgReqDto: UpdateGrPkgReqDto): Promise<BaseResDto> {
    return this.groupService.rmPkg(updateGrPkgReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.GROUP.GET_DELETED)
  findWithDeleted(
    @Payload() paginationParams: PaginationParams,
  ): Promise<GetGrsResDto> {
    return this.groupService.findWithDeleted(paginationParams);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.GROUP.GET_BY_USER)
  findByUser(
    @Payload() paginationParams: PaginationParams,
  ): Promise<GetGrsResDto> {
    return this.groupService.findByUser(paginationParams);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.GROUP.UPDATE_AVATAR)
  updateAvatar(
    @Payload() updateAvatarReqDto: UpdateAvatarReqDto,
  ): Promise<BaseResDto> {
    return this.groupService.updateAvatar(updateAvatarReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.GROUP.UPDATE_CHANNEL)
  updateChannel(
    @Payload() updateChannelReqDto: UpdateChannelReqDto,
  ): Promise<BaseResDto> {
    return this.groupService.updateChannel(updateChannelReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.GROUP.ACTIVATE_PKG)
  activatePkg(
    @Payload() activateGrPkgReqDto: ActivateGrPkgReqDto,
  ): Promise<BaseResDto> {
    return this.groupService.activatePkg(activateGrPkgReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.GROUP.IS_SU)
  isSU(@Payload() checkGrSUReqDto: CheckGrSUReqDto): Promise<boolean> {
    return this.groupService.isSU(checkGrSUReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.GROUP.GET_BY_EXTENSION)
  findByExtension(
    @Payload() getGrByExReqDto: GetGrByExReqDto,
  ): Promise<GetGrResDto> {
    return this.groupService.findByExtension(getGrByExReqDto);
  }
}
