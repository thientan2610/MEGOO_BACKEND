import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FundingService } from './funding.service';
import {
  BaseResDto,
  CreateFundingReqDto,
  GetFundingResDto,
  SendReqDto,
  UpdateFundingSttReqDto,
  kafkaTopic,
} from '@nyp19vp-be/shared';
import { Types } from 'mongoose';

@Controller()
export class FundingController {
  constructor(private readonly fundingService: FundingService) {}

  @MessagePattern(kafkaTopic.PKG_MGMT.FUNDING.CREATE)
  create(
    @Payload() createFundingDto: CreateFundingReqDto,
  ): Promise<BaseResDto> {
    return this.fundingService.create(createFundingDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.FUNDING.GET_BY_ID)
  findById(@Payload() id: Types.ObjectId): Promise<GetFundingResDto> {
    return this.fundingService.findById(id);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.FUNDING.UPDATE)
  update(
    @Payload() updateFundingDto: CreateFundingReqDto,
  ): Promise<BaseResDto> {
    return this.fundingService.update(updateFundingDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.FUNDING.UPDATE_OCCURRENCE)
  updateOccurrence(id: Types.ObjectId): Promise<BaseResDto> {
    return this.fundingService.updateOccurrence(id);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.FUNDING.UPDATE_STT)
  updateStt(updateStt: UpdateFundingSttReqDto): Promise<BaseResDto> {
    return this.fundingService.updateStt(updateStt);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.FUNDING.ADD_HISTORY)
  addFundHist(@Payload() id: Types.ObjectId): Promise<BaseResDto> {
    return this.fundingService.addFundHist(id);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.FUNDING.DELETE)
  remove(@Payload() id: Types.ObjectId): Promise<BaseResDto> {
    return this.fundingService.remove(id);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.FUNDING.RESTORE)
  restore(@Payload() id: Types.ObjectId): Promise<BaseResDto> {
    return this.fundingService.restore(id);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.FUNDING.SEND_REQ)
  sendRequest(@Payload() sendReqDto: SendReqDto): Promise<BaseResDto> {
    return this.fundingService.sendRequest(sendReqDto);
  }
}
