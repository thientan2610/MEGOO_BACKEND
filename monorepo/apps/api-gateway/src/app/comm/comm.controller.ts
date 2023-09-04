import {
  Controller,
  Body,
  Inject,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { CommService } from './comm.service';
import {
  ClientSocketReqDto,
  ClientSocketResDto,
  kafkaTopic,
} from '@nyp19vp-be/shared';
import { ClientKafka } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Communication')
@Controller('comm')
export class CommController {
  constructor(
    private readonly commService: CommService,
    @Inject('COMM_SERVICE') private readonly commClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.commClient.subscribeToResponseOf(kafkaTopic.HEALT_CHECK.COMM);
    for (const key in kafkaTopic.COMM) {
      this.commClient.subscribeToResponseOf(kafkaTopic.COMM[key]);
    }
    await Promise.all([this.commClient.connect()]);
  }

  @Post('/socket-client')
  createClientSocket(
    @Body() clientSocketReqDto: ClientSocketReqDto,
  ): Promise<ClientSocketResDto> {
    console.log(`save client socket of user #${clientSocketReqDto.user_id}`);
    return this.commService.createClientSocket(clientSocketReqDto);
  }

  @Delete('/socket-client')
  removeClientSocket(
    @Body() clientSocketReqDto: ClientSocketReqDto,
  ): Promise<ClientSocketResDto> {
    console.log(`save client socket of user #${clientSocketReqDto.user_id}`);
    return this.commService.removeClientSocket(clientSocketReqDto);
  }

  @Get('socket-client/:id')
  getClientSocket(@Param('id') user_id: string): Promise<ClientSocketResDto> {
    console.log(`get client socket from user #${user_id}`);
    return this.commService.getClientSocket(user_id);
  }
}
