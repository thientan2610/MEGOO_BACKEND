import {
  CollectionDto,
  CollectionResponse,
} from '@forlagshuset/nestjs-mongoose-paginate';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  BaseResDto,
  CheckoutReqDto,
  CreateTransReqDto,
  CreateUserReqDto,
  GetCartResDto,
  GetUserResDto,
  GetUserSettingResDto,
  kafkaTopic,
  MOP,
  RenewGrPkgReqDto,
  UpdateAvatarReqDto,
  UpdateCartReqDto,
  UpdateSettingReqDto,
  UpdateUserReqDto,
  UserDto,
  ZPCheckoutResDto,
} from '@nyp19vp-be/shared';
import { Types } from 'mongoose';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { TxnService } from '../txn/txn.service';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USERS_SERVICE') private readonly usersClient: ClientKafka,
    private schedulerRegistry: SchedulerRegistry,
    private readonly txnService: TxnService,
  ) {}
  async createUser(createUserReqDto: CreateUserReqDto): Promise<BaseResDto> {
    const res = await firstValueFrom(
      this.usersClient
        .send(kafkaTopic.USERS.CREATE, JSON.stringify(createUserReqDto))
        .pipe(
          timeout(10000),
          catchError(() => {
            throw new RequestTimeoutException();
          }),
        ),
    );
    if (res.statusCode == HttpStatus.CREATED) {
      return res;
    } else {
      throw new HttpException(res.message, res.statusCode, {
        cause: new Error(res.error),
        description: res.error,
      });
    }
  }
  async updateUser(updateUserReqDto: UpdateUserReqDto): Promise<BaseResDto> {
    const res = await firstValueFrom(
      this.usersClient
        .send(kafkaTopic.USERS.UPDATE_INFO, JSON.stringify(updateUserReqDto))
        .pipe(
          timeout(10000),
          catchError(() => {
            throw new RequestTimeoutException();
          }),
        ),
    );
    if (res.statusCode == HttpStatus.OK) {
      return res;
    } else {
      throw new HttpException(res.message, res.statusCode, {
        cause: new Error(res.error),
        description: res.error,
      });
    }
  }
  async getUserById(id: Types.ObjectId): Promise<GetUserResDto> {
    return await firstValueFrom(
      this.usersClient.send(kafkaTopic.USERS.GET_BY_ID, id).pipe(
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
  async getUserSettingById(id: Types.ObjectId): Promise<GetUserSettingResDto> {
    return await firstValueFrom(
      this.usersClient.send(kafkaTopic.USERS.GET_SETTING_BY_ID, id).pipe(
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
  async getAllUsers(
    collectionDto: CollectionDto,
  ): Promise<CollectionResponse<UserDto>> {
    return await firstValueFrom(
      this.usersClient.send(kafkaTopic.USERS.GET, collectionDto),
    );
  }
  async updateSetting(
    updateSettingReqDto: UpdateSettingReqDto,
  ): Promise<BaseResDto> {
    return await firstValueFrom(
      this.usersClient
        .send(
          kafkaTopic.USERS.UPDATE_SETTING,
          JSON.stringify(updateSettingReqDto),
        )
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
  async updateAvatar(
    updateAvatarReqDto: UpdateAvatarReqDto,
  ): Promise<BaseResDto> {
    return await firstValueFrom(
      this.usersClient
        .send(
          kafkaTopic.USERS.UPDATE_AVATAR,
          JSON.stringify(updateAvatarReqDto),
        )
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

  async deleteUser(id: Types.ObjectId): Promise<BaseResDto> {
    return await firstValueFrom(
      this.usersClient.send(kafkaTopic.USERS.REMOVE, id).pipe(
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
  async updateCart(updateCartReqDto: UpdateCartReqDto): Promise<BaseResDto> {
    return await firstValueFrom(
      this.usersClient
        .send(kafkaTopic.USERS.UPDATE_CART, JSON.stringify(updateCartReqDto))
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
  async getCart(id: Types.ObjectId): Promise<GetCartResDto> {
    return await firstValueFrom(
      this.usersClient.send(kafkaTopic.USERS.GET_CART, id).pipe(
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
  public scheduleTimeout(
    jobName: string,
    milliseconds: number,
    data: CreateTransReqDto,
  ) {
    const callback = async () => {
      console.warn(`Timeout ${jobName} executing after (${milliseconds})!`);
      const res = this.txnService.zpGetStatus(data);
      console.log(res);
    };
    const timeout = setTimeout(callback, milliseconds);
    this.schedulerRegistry.addTimeout(jobName, timeout);
  }
  async checkout(
    checkoutReqDto: CheckoutReqDto,
  ): Promise<ZPCheckoutResDto | BaseResDto> {
    return await firstValueFrom(
      this.usersClient
        .send(kafkaTopic.USERS.CHECKOUT, JSON.stringify(checkoutReqDto))
        .pipe(
          timeout(10000),
          catchError(() => {
            throw new RequestTimeoutException();
          }),
        ),
    ).then((res) => {
      if (res.statusCode == HttpStatus.OK) {
        if (checkoutReqDto.method.type === MOP.KEY.EWALLET.ZALOPAY) {
          this.scheduleTimeout(
            `checkout-getStt-${res.trans._id}`,
            240000,
            res.trans,
          );
        }

        return res;
      } else {
        throw new HttpException(res.message, res.statusCode);
      }
    });
  }
  async searchUser(keyword: string): Promise<UserDto[]> {
    return await firstValueFrom(
      this.usersClient.send(kafkaTopic.USERS.SEARCH_USER, keyword).pipe(
        timeout(10000),
        catchError(() => {
          throw new RequestTimeoutException();
        }),
      ),
    );
  }
  async restoreUser(id: Types.ObjectId): Promise<BaseResDto> {
    return await firstValueFrom(
      this.usersClient.send(kafkaTopic.USERS.RESTORE, id).pipe(
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
  async renewPkg(
    renewGrPkgReqDto: RenewGrPkgReqDto,
  ): Promise<ZPCheckoutResDto | BaseResDto> {
    return await firstValueFrom(
      this.usersClient
        .send(kafkaTopic.USERS.RENEW_PKG, JSON.stringify(renewGrPkgReqDto))
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
  async getWithDeleted(req): Promise<UserDto[]> {
    return await firstValueFrom(
      this.usersClient.send(kafkaTopic.USERS.GET_DELETED, req).pipe(
        timeout(10000),
        catchError(() => {
          throw new RequestTimeoutException();
        }),
      ),
    );
  }
  async statistic(req): Promise<BaseResDto> {
    return await firstValueFrom(
      this.usersClient.send(kafkaTopic.USERS.STATISTIC, req).pipe(
        timeout(10000),
        catchError(() => {
          throw new RequestTimeoutException();
        }),
      ),
    );
  }
}
