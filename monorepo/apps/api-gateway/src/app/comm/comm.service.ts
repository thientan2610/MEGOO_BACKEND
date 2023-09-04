import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import {
  ClientSocketReqDto,
  ClientSocketResDto,
  kafkaTopic,
} from '@nyp19vp-be/shared';
import { catchError, firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class CommService {
  constructor(
    @Inject('COMM_SERVICE') private readonly commClient: ClientKafka,
  ) {}
  async createClientSocket(
    clientSocketReqDto: ClientSocketReqDto,
  ): Promise<ClientSocketResDto> {
    return await firstValueFrom(
      this.commClient
        .send(kafkaTopic.COMM.CREATE_CLIENT, JSON.stringify(clientSocketReqDto))
        .pipe(
          timeout(10000),
          catchError(() => {
            throw new RequestTimeoutException();
          }),
        ),
    ).then((res) => {
      if (res.statusCode == HttpStatus.CREATED) {
        return res;
      } else {
        throw new HttpException(res.message, res.statusCode);
      }
    });
  }
  async removeClientSocket(
    clientSocketReqDto: ClientSocketReqDto,
  ): Promise<ClientSocketResDto> {
    return await firstValueFrom(
      this.commClient
        .send(kafkaTopic.COMM.RM_CLIENT, JSON.stringify(clientSocketReqDto))
        .pipe(
          timeout(10000),
          catchError(() => {
            throw new RequestTimeoutException();
          }),
        ),
    ).then((res) => {
      if (res.statusCode == HttpStatus.OK) {
        return res;
      } else {
        throw new HttpException(res.message, res.statusCode);
      }
    });
  }

  async getClientSocket(user_id: string): Promise<ClientSocketResDto> {
    return await firstValueFrom(
      this.commClient.send(kafkaTopic.COMM.GET_CLIENT, user_id).pipe(
        timeout(10000),
        catchError(() => {
          throw new RequestTimeoutException();
        }),
      ),
    ).then((res) => {
      if (res.statusCode == HttpStatus.OK) {
        return res;
      } else {
        throw new HttpException(res.message, res.statusCode);
      }
    });
  }
}
