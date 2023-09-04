import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BillService } from './bill.service';
import {
  BaseResDto,
  CreateBillReqDto,
  GetBillResDto,
  SendRequestReqDto,
  UpdateBillReqDto,
  UpdateBillSttReqDto,
  kafkaTopic,
} from '@nyp19vp-be/shared';
import { Types } from 'mongoose';

@Controller()
export class BillController {
  constructor(private readonly billService: BillService) {}

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.BILL.CREATE)
  create(@Payload() createBillReqDto: CreateBillReqDto): Promise<BaseResDto> {
    return this.billService.create(createBillReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.BILL.GET_BY_ID)
  findById(@Payload() id: Types.ObjectId): Promise<GetBillResDto> {
    return this.billService.findById(id);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.BILL.UPDATE)
  update(@Payload() updateBillReqDto: UpdateBillReqDto): Promise<BaseResDto> {
    return this.billService.update(updateBillReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.BILL.UPDATE_STT)
  updateStt(
    @Payload() updateBillSttReqDto: UpdateBillSttReqDto,
  ): Promise<BaseResDto> {
    return this.billService.updateStt(updateBillSttReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.BILL.SEND_REQ)
  sendRequest(
    @Payload() sendRequestReqDto: SendRequestReqDto,
  ): Promise<BaseResDto> {
    return this.billService.sendRequest(sendRequestReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.BILL.DELETE)
  remove(@Payload() id: Types.ObjectId): Promise<BaseResDto> {
    return this.billService.remove(id);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.BILL.RESTORE)
  restore(@Payload() id: Types.ObjectId): Promise<BaseResDto> {
    return this.billService.restore(id);
  }
}
