import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TxnCrudService } from './txn-crud.service';
import {
  BaseResDto,
  CheckoutReqDto,
  CreateTransReqDto,
  VNPIpnUrlReqDto,
  ZPCheckoutResDto,
  ZPDataCallback,
  kafkaTopic,
} from '@nyp19vp-be/shared';
import {
  CollectionDto,
  CollectionResponse,
} from '@forlagshuset/nestjs-mongoose-paginate';
@Controller()
export class TxnCrudController {
  constructor(private readonly txnCrudService: TxnCrudService) {}

  @MessagePattern(kafkaTopic.TXN.ZP_CREATE_ORD)
  async zpCheckout(
    @Payload() checkoutReqDto: CheckoutReqDto,
  ): Promise<ZPCheckoutResDto> {
    return await this.txnCrudService.zpCheckout(checkoutReqDto);
  }

  @MessagePattern(kafkaTopic.TXN.ZP_GET_STT)
  async zpGetStatus(
    @Payload() createTransReqDto: CreateTransReqDto,
  ): Promise<BaseResDto> {
    return await this.txnCrudService.zpGetStatus(createTransReqDto);
  }

  @MessagePattern(kafkaTopic.TXN.ZP_CREATE_TRANS)
  async zpCreateTrans(
    @Payload() zpDataCallback: ZPDataCallback,
  ): Promise<BaseResDto> {
    return await this.txnCrudService.zpCreateTrans(zpDataCallback);
  }

  @MessagePattern(kafkaTopic.TXN.VNP_CREATE_ORD)
  async vnpCreateOrder(
    @Payload() checkoutReqDto: CheckoutReqDto,
  ): Promise<BaseResDto> {
    return await this.txnCrudService.vnpCreateOrder(checkoutReqDto);
  }

  @MessagePattern(kafkaTopic.TXN.VNP_CALLBACK)
  async vnpCallback(
    @Payload() vnpIpnUrlReqDto: VNPIpnUrlReqDto,
  ): Promise<BaseResDto> {
    return await this.txnCrudService.vnpCallback(vnpIpnUrlReqDto);
  }

  @MessagePattern(kafkaTopic.TXN.GET_BY_USER)
  async findByUser(@Payload() user_id: string): Promise<BaseResDto> {
    return await this.txnCrudService.findByUser(user_id);
  }

  @MessagePattern(kafkaTopic.TXN.GET)
  async find(
    @Payload() collectionDto: CollectionDto,
  ): Promise<CollectionResponse<CreateTransReqDto>> {
    return await this.txnCrudService.find(collectionDto);
  }

  @MessagePattern(kafkaTopic.TXN.STATISTIC)
  async statistic(@Payload() req): Promise<BaseResDto> {
    return await this.txnCrudService.statistic(req);
  }
}
