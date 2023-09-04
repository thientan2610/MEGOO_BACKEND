import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import {
  BaseResDto,
  CreateTransReqDto,
  VNPIpnUrlReqDto,
  ZPCallbackReqDto,
  ZPDataCallback,
  kafkaTopic,
} from '@nyp19vp-be/shared';
import { createHmac } from 'crypto';
import { ClientKafka } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { SocketGateway } from '../socket/socket.gateway';
import {
  CollectionDto,
  CollectionResponse,
} from '@forlagshuset/nestjs-mongoose-paginate';

@Injectable()
export class TxnService {
  constructor(
    @Inject('ZALOPAY_CONFIG') private readonly zpconfig,
    @Inject('TXN_SERVICE') private readonly txnClient: ClientKafka,
    private readonly socketGateway: SocketGateway,
  ) {}
  async zpCallback(callbackReqDto: ZPCallbackReqDto) {
    try {
      const dataStr = callbackReqDto.data;
      const reqMac = callbackReqDto.mac;
      const mac: string = createHmac('sha256', this.zpconfig.key2)
        .update(dataStr)
        .digest('hex');
      console.log('mac=', mac);
      if (reqMac !== mac) {
        return JSON.stringify({
          return_code: -1,
          return_message: 'mac not equal',
        });
      } else {
        let zpDataCallback: ZPDataCallback;
        if (typeof dataStr === 'object') {
          zpDataCallback = dataStr;
        } else if (typeof dataStr === 'string') {
          zpDataCallback = JSON.parse(dataStr);
        }
        await firstValueFrom(
          this.txnClient.send(
            kafkaTopic.TXN.ZP_CREATE_TRANS,
            JSON.stringify(zpDataCallback),
          ),
        );
        await this.socketGateway.handleEvent(
          'zpCallback',
          zpDataCallback.app_user,
          dataStr,
        );
        return JSON.stringify({
          return_code: 1,
          return_message: 'success',
        });
      }
    } catch (error) {
      return JSON.stringify({
        return_code: 0,
        return_message: error.return_message,
      });
    }
  }
  async zpGetStatus(createTransReqDto: CreateTransReqDto): Promise<any> {
    return await firstValueFrom(
      this.txnClient.send(
        kafkaTopic.TXN.ZP_GET_STT,
        JSON.stringify(createTransReqDto),
      ),
    );
  }
  async vnpCallback(vnpIpnUrlReqDto: VNPIpnUrlReqDto): Promise<any> {
    return await firstValueFrom(
      this.txnClient
        .send(kafkaTopic.TXN.VNP_CALLBACK, JSON.stringify(vnpIpnUrlReqDto))
        .pipe(
          timeout(10000),
          catchError(() => {
            throw new RequestTimeoutException();
          }),
        ),
    ).then(async (res) => {
      if (res.statusCode == HttpStatus.OK) {
        const info = vnpIpnUrlReqDto.vnp_OrderInfo;
        const infos = info.split('#');
        await this.socketGateway.handleEvent(
          'vnpCallback',
          infos[0],
          vnpIpnUrlReqDto,
        );
        return res;
      } else {
        throw new HttpException(res.message, res.statusCode);
      }
    });
  }
  async findByUser(user_id: string): Promise<BaseResDto> {
    return await firstValueFrom(
      this.txnClient.send(kafkaTopic.TXN.GET_BY_USER, user_id).pipe(
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
  async find(
    collectionDto: CollectionDto,
  ): Promise<CollectionResponse<CreateTransReqDto>> {
    return await firstValueFrom(
      this.txnClient.send(kafkaTopic.TXN.GET, collectionDto),
    );
  }

  async statistic(req): Promise<BaseResDto> {
    return await firstValueFrom(
      this.txnClient.send(kafkaTopic.TXN.STATISTIC, req),
    );
  }
}
