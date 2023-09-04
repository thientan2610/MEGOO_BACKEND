import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { SocketService } from './socket.service';
import { CommService } from '../comm/comm.service';
import { ClientSocketReqDto } from '@nyp19vp-be/shared';
import { HttpStatus } from '@nestjs/common';

@WebSocketGateway(3001, { cors: true })
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly socketService: SocketService,
    private readonly commService: CommService,
  ) {}

  @WebSocketServer() server: Server;

  getUserFromToken(client: Socket) {
    const token = client.handshake?.query?.token;
    return token;
  }

  async handleConnection(client: Socket) {
    const user = this.getUserFromToken(client);
    console.log(user, client.id, 'Connected..............................');
    try {
      await this.commService.createClientSocket(
        mapToClientSocketReqDto(user, client),
      );
    } catch (error) {
      console.error(error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = this.getUserFromToken(client);
    console.log(user, client.id, 'Disconnect');
    try {
      await this.commService.removeClientSocket(
        mapToClientSocketReqDto(user, client),
      );
    } catch (error) {
      console.error(error);
      client.disconnect();
    }
  }

  afterInit(server) {
    console.log('Socket Gateway Initialized');
  }

  async handleEvent(event: string, user_id: string, data) {
    const client = await this.commService.getClientSocket(user_id);
    if (client.socket) {
      console.log(event, 'emitted to', client.socket.client_id, ':', data);
      this.server.to(client.socket.client_id).emit(event, data);
    }
  }

  @SubscribeMessage('receive-message')
  async checkout_callback(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: string,
  ) {
    // this.server.to(client.id).emit('send_message', data);
    await this.handleEvent('send_message', data, data);
  }
}
const mapToClientSocketReqDto = (user, client: Socket): ClientSocketReqDto => {
  const clientSocketReqDto: ClientSocketReqDto = {
    user_id: user,
    client_id: client.id,
  };
  return clientSocketReqDto;
};
