import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SocketCrudService } from './socket-crud.service';
import {
  ClientSocketReqDto,
  ClientSocketResDto,
  kafkaTopic,
} from '@nyp19vp-be/shared';

@Controller()
export class SocketCrudController {
  constructor(private readonly socketCrudService: SocketCrudService) {}

  @MessagePattern(kafkaTopic.COMM.CREATE_CLIENT)
  create(
    @Payload() clientSocketReqDto: ClientSocketReqDto,
  ): Promise<ClientSocketResDto> {
    return this.socketCrudService.create(clientSocketReqDto);
  }
  @MessagePattern(kafkaTopic.COMM.RM_CLIENT)
  remove(
    @Payload() clientSocketReqDto: ClientSocketReqDto,
  ): Promise<ClientSocketResDto> {
    return this.socketCrudService.remove(clientSocketReqDto);
  }
  @MessagePattern(kafkaTopic.COMM.GET_CLIENT)
  findByUserId(@Payload() user_id: string): Promise<ClientSocketResDto> {
    return this.socketCrudService.findByUserId(user_id);
  }
}
