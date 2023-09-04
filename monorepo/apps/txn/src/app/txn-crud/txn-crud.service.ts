import {
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  ItemDto,
  Items,
  PackageDto,
  kafkaTopic,
  ZPCreateOrderReqDto,
  ZPCreateOrderResDto,
  ZPGetOrderStatusResDto,
  ZPGetOrderStatusReqDto,
  CreateTransReqDto,
  ZPDataCallback,
  UpdateTrxHistReqDto,
  EmbedData,
  ZPCheckoutResDto,
  CreateGrReqDto,
  UpdateGrPkgReqDto,
  CheckoutReqDto,
  VNPIpnUrlReqDto,
  BaseResDto,
} from '@nyp19vp-be/shared';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ClientKafka } from '@nestjs/microservices';
import { createHmac } from 'crypto';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { setIntervalAsync, clearIntervalAsync } from 'set-interval-async';
import { Transaction, TransactionDocument } from '../../schemas/txn.schema';
import mongoose from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as MOP from '../../core/constants/payment_method.constants';
import { SoftDeleteModel } from 'mongoose-delete';
import moment from 'moment-timezone';
import * as qs from 'qs';
import {
  CollectionDto,
  CollectionResponse,
  DocumentCollector,
} from '@forlagshuset/nestjs-mongoose-paginate';

@Injectable()
export class TxnCrudService implements OnModuleInit {
  constructor(
    private httpService: HttpService,
    @InjectModel(Transaction.name)
    private transModel: SoftDeleteModel<TransactionDocument>,
    @Inject('PKG_MGMT_SERVICE') private readonly pkgClient: ClientKafka,
    @Inject('USERS_SERVICE') private readonly usersClient: ClientKafka,
    @Inject('ZALOPAY_CONFIG') private readonly zpconfig,
    @Inject('VNPAY_CONFIG') private readonly vnpconfig,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async onModuleInit() {
    const pkgTopics = Object.values(kafkaTopic.PKG_MGMT.GROUP);

    for (const topic of pkgTopics) {
      this.pkgClient.subscribeToResponseOf(topic);
    }

    this.pkgClient.subscribeToResponseOf(kafkaTopic.PKG_MGMT.PACKAGE.GET_MANY);

    this.usersClient.subscribeToResponseOf(kafkaTopic.HEALT_CHECK.USERS);
    for (const key in kafkaTopic.USERS) {
      this.usersClient.subscribeToResponseOf(kafkaTopic.USERS[key]);
    }
    await Promise.all([this.usersClient.connect()]);
  }
  async findByUser(user_id: string): Promise<BaseResDto> {
    console.log('Get transactions by user', user_id);
    return this.transModel
      .find({ user: user_id })
      .then((res) => {
        return {
          statusCode: HttpStatus.OK,
          message: `Get transactions by user #${user_id}`,
          data: res,
        };
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
        });
      });
  }
  async find(
    collectionDto: CollectionDto,
  ): Promise<CollectionResponse<CreateTransReqDto>> {
    console.log(`txn-svc#get-all-transactions`);
    const collector = new DocumentCollector<TransactionDocument>(
      this.transModel,
    );
    return await collector
      .find(collectionDto)
      .then((res) => {
        return Promise.resolve({
          data: res.data,
          pagination: res.pagination,
        });
      })
      .catch((err) => {
        throw err;
      });
  }
  async zpCheckout(checkoutReqDto: CheckoutReqDto): Promise<ZPCheckoutResDto> {
    const { _id, cart, group } = checkoutReqDto;
    console.log(`Checkout #${_id}`, cart);
    const list_id = cart.map((x) => x.package);
    try {
      const res = await firstValueFrom(
        this.pkgClient
          .send(kafkaTopic.PKG_MGMT.PACKAGE.GET_MANY, list_id)
          .pipe(timeout(10000)),
      );
      if (res.length) {
        const zaloPayReq = mapZaloPayReqDto(
          _id,
          mapPkgDtoToItemDto(res, cart),
          group,
          this.zpconfig,
        );
        console.log(zaloPayReq);
        const order = await this.zpCreateOrder(zaloPayReq);
        console.log(order);
        if (order.return_code == 1) {
          const trans = mapZPCreateOrderReqDtoToCreateTransReqDto(zaloPayReq);
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `Create order successfully`,
            order: order,
            trans: trans,
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.BAD_GATEWAY,
            message: `Create order failed`,
            order: order,
            trans: null,
          });
        }
      } else {
        return Promise.resolve({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Package have been removed',
          order: null,
          trans: null,
        });
      }
    } catch (error) {
      return Promise.resolve({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        order: null,
        trans: null,
      });
    }
  }

  async zpGetStatus(createTransReqDto: CreateTransReqDto): Promise<BaseResDto> {
    const { _id, user } = createTransReqDto;
    const zpGetOrderStatusReqDto: ZPGetOrderStatusReqDto = mapZPGetStatusReqDto(
      _id,
      this.zpconfig,
    );
    const res = await this.zpCheckStatus(zpGetOrderStatusReqDto);
    console.log('result:', res);
    if (typeof res === 'string') {
      return Promise.resolve({
        statusCode: HttpStatus.REQUEST_TIMEOUT,
        message: `Request timeout`,
      });
    } else {
      this.transModel.findById({ _id: _id }).then(async (checkExist) => {
        if (!checkExist) {
          let result: BaseResDto;
          const session = await this.connection.startSession();
          session.startTransaction();
          try {
            const newTrans = new this.transModel({
              _id: _id,
              user: user,
              amount: createTransReqDto.amount,
              item: createTransReqDto.item,
              method: {
                type: MOP.PAYMENT_METHOD.EWALLET,
                name: MOP.EWALLET.ZALOPAY,
              },
            });
            const trans = (await newTrans.save()).$session(session);
            if (!trans) {
              throw new NotFoundException();
            }
            const createGrReqDto: CreateGrReqDto = mapCreateGrReqDto(
              createTransReqDto.item,
              user,
            );
            const createGr = await firstValueFrom(
              this.pkgClient.send(
                kafkaTopic.PKG_MGMT.GROUP.CREATE,
                createGrReqDto,
              ),
            );
            if (createGr.statusCode == HttpStatus.CREATED) {
              await session.commitTransaction();
              result = {
                statusCode: HttpStatus.CREATED,
                message: `Create groups successfully`,
              };
            } else {
              await session.abortTransaction();
              result = {
                statusCode: createGr.statusCode,
                message: createGr.message,
              };
            }
            const updateTrxHistReqDto = mapUpdateTrxHistReqDto(
              user,
              _id,
              createTransReqDto.item,
            );
            const res = await firstValueFrom(
              this.usersClient.send(
                kafkaTopic.USERS.UPDATE_TRX,
                updateTrxHistReqDto,
              ),
            );
            if (res.statusCode == HttpStatus.OK) {
              await session.commitTransaction();
              result = {
                statusCode: HttpStatus.OK,
                message: `Create Transaction #${_id} successfully`,
              };
            } else {
              await session.abortTransaction();
              result = {
                statusCode: res.statusCode,
                message: res.message,
              };
            }
          } catch (error) {
            await session.abortTransaction();
            result = {
              statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
              message: error.message,
            };
          } finally {
            session.endSession();
            // eslint-disable-next-line no-unsafe-finally
            return Promise.resolve(result);
          }
        }
      });
    }
  }

  async zpCreateTrans(zpDataCallback: ZPDataCallback): Promise<BaseResDto> {
    const item: ItemDto[] = JSON.parse(zpDataCallback.item);
    const newTrans = new this.transModel({
      _id: zpDataCallback.app_trans_id,
      user: zpDataCallback.app_user,
      item: item,
      amount: zpDataCallback.amount,
      method: {
        type: MOP.PAYMENT_METHOD.EWALLET,
        name: MOP.EWALLET.ZALOPAY,
        trans_id: zpDataCallback.zp_trans_id,
        embed_data: {
          channel: MOP.ZALOPAY[zpDataCallback.channel],
          zp_user_id: zpDataCallback.merchant_user_id,
          user_fee_amount: zpDataCallback.user_fee_amount,
          discount_amount: zpDataCallback.discount_amount,
        },
      },
    });
    const trans = await newTrans.save();
    if (trans) {
      const updateTrxHistReqDto = mapUpdateTrxHistReqDto(
        zpDataCallback.app_user,
        zpDataCallback.app_trans_id,
        item,
      );
      const updateTrxHist = await firstValueFrom(
        this.usersClient
          .send(kafkaTopic.USERS.UPDATE_TRX, updateTrxHistReqDto)
          .pipe(timeout(10000)),
      );
      if (updateTrxHist.statusCode != HttpStatus.OK) {
        return Promise.resolve({
          statusCode: updateTrxHist.statusCode,
          message: updateTrxHist.message,
        });
      } else {
        const embedData = JSON.parse(zpDataCallback.embed_data);
        if (embedData.columninfo) {
          const columninfo = JSON.parse(embedData.columninfo);
          const updateGrPkgReqDto: UpdateGrPkgReqDto = {
            _id: columninfo.group_id,
            package: {
              _id: item[0].id,
              duration: item[0].duration,
              noOfMember: item[0].noOfMember,
            },
            user: zpDataCallback.app_user,
          };
          const renewGrPkg = await firstValueFrom(
            this.pkgClient
              .send(kafkaTopic.PKG_MGMT.GROUP.ADD_PKG, updateGrPkgReqDto)
              .pipe(timeout(10000)),
          );
          if (renewGrPkg.statusCode != HttpStatus.OK) {
            return Promise.resolve({
              statusCode: renewGrPkg.statusCode,
              message: renewGrPkg.message,
            });
          }
        } else {
          const createGrReqDto: CreateGrReqDto = mapCreateGrReqDto(
            item,
            zpDataCallback.app_user,
          );
          const createGr = await firstValueFrom(
            this.pkgClient
              .send(kafkaTopic.PKG_MGMT.GROUP.CREATE, createGrReqDto)
              .pipe(timeout(10000)),
          );
          if (createGr.statusCode != HttpStatus.CREATED) {
            return Promise.resolve({
              statusCode: createGr.statusCode,
              message: createGr.message,
            });
          }
        }
      }
    }
  }

  zpCheckStatus(
    zpGetOrderStatusReqDto: ZPGetOrderStatusReqDto,
  ): Promise<ZPGetOrderStatusResDto | string> {
    let timer;
    return new Promise((resolve) => {
      timer = setIntervalAsync(async () => {
        console.log('get status', zpGetOrderStatusReqDto.app_trans_id);
        const res: ZPGetOrderStatusResDto = await this.zpGetOrderStatus(
          zpGetOrderStatusReqDto,
        );
        if (res.return_code == 1) {
          resolve(res);
          await clearIntervalAsync(timer);
        }
      }, 5 * 60 * 1000);
      setTimeout(async () => {
        resolve('Timeout');
        await clearIntervalAsync(timer);
      }, 15 * 60 * 1000);
    });
  }

  async zpCreateOrder(
    zalopayReqDto: ZPCreateOrderReqDto,
  ): Promise<ZPCreateOrderResDto> {
    const { data } = await firstValueFrom(
      this.httpService
        .post(this.zpconfig.create_order_endpoint, null, {
          params: zalopayReqDto,
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw error.response.data;
          }),
        ),
    );
    return data;
  }
  async statistic(req): Promise<BaseResDto> {
    console.log('statistic');
    const countWithDeleted = await this.transModel.countWithDeleted();
    const countDeleted = await this.transModel.countDeleted();
    const count = await this.transModel.count();

    const total = await this.transModel.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const pkgByMonth = await this.transModel.aggregate([
      { $match: { createdAt: { $gte: lastMonth } } },
      { $unwind: '$item' },
      {
        $group: {
          _id: { _id: '$item.id', name: '$item.name' },
          totalQuantity: { $sum: '$item.quantity' },
        },
      },
    ]);
    const pkgByYear = await this.transModel.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      { $unwind: '$item' },
      {
        $group: {
          _id: { _id: '$item.id', name: '$item.name' },
          totalQuantity: { $sum: '$item.quantity' },
        },
      },
    ]);
    const statisticTrans = await this.transModel.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const period = await this.transModel.aggregate([
      {
        $group: {
          _id: null,
          minCreatedAt: { $min: '$createdAt' },
          maxCreatedAt: { $max: '$createdAt' },
        },
      },
    ]);
    const data = {
      countTxn: count,
      countDeletedTxn: countDeleted,
      countWithDeletedTxn: countWithDeleted,
      statisticTrans: statisticTrans,
      totalRevenue: total[0].total,
      pkgByMonth: pkgByMonth,
      pkgByYear: pkgByYear,
      period: { min: period[0].minCreatedAt, max: period[0].maxCreatedAt },
    };
    return Promise.resolve({
      statusCode: HttpStatus.OK,
      message: `Statistic transactions successfully`,
      data: data,
    });
  }
  async zpGetOrderStatus(
    zpGetOrderStatusReqDto: ZPGetOrderStatusReqDto,
  ): Promise<ZPGetOrderStatusResDto> {
    const { data } = await firstValueFrom(
      this.httpService
        .post(this.zpconfig.get_status_endpoint, null, {
          params: zpGetOrderStatusReqDto,
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw error.response.data;
          }),
        ),
    );
    return data;
  }
  async vnpCreateOrder(checkoutReqDto: CheckoutReqDto): Promise<BaseResDto> {
    const { _id, cart, ipAddr, group } = checkoutReqDto;
    console.log(`VnPay Checkout #${_id}`, cart);
    const list_id = cart.map((x) => x.package);
    const res = await firstValueFrom(
      this.pkgClient
        .send(kafkaTopic.PKG_MGMT.PACKAGE.GET_MANY, list_id)
        .pipe(timeout(10000)),
    );
    if (res.length) {
      const vnPayReq = mapVNPCreateOrderReqDto(
        ipAddr,
        _id,
        mapPkgDtoToItemDto(res, cart),
        group,
        this.vnpconfig,
      );
      console.log(vnPayReq);
      return Promise.resolve({
        statusCode: HttpStatus.OK,
        message: 'Create order successfully',
        data: vnPayReq,
      });
    } else {
      return Promise.resolve({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Package have been removed',
      });
    }
  }
  async vnpCallback(vnpIpnUrlReqDto: VNPIpnUrlReqDto): Promise<any> {
    let result: BaseResDto;
    console.log('VnPay Callback:', vnpIpnUrlReqDto);
    const secureHash = vnpIpnUrlReqDto.vnp_SecureHash;
    const resCode = vnpIpnUrlReqDto.vnp_ResponseCode;
    const info = vnpIpnUrlReqDto.vnp_OrderInfo;
    delete vnpIpnUrlReqDto.vnp_SecureHash;
    delete vnpIpnUrlReqDto.vnp_SecureHashType;
    const infos = info.split('#');
    const users = infos[0];
    const items = JSON.parse(infos[1]);
    const group = infos.length > 2 ? infos[2] : null;
    const trans_id = vnpIpnUrlReqDto.vnp_TxnRef;

    const vnpParams = sortObject(vnpIpnUrlReqDto);
    const hmacinput = qs.stringify(vnpParams, { encode: false });
    const hmac = createHmac('sha512', this.vnpconfig.key);
    const mac = hmac.update(Buffer.from(hmacinput, 'utf-8')).digest('hex');
    if (secureHash === mac) {
      if (resCode == 0) {
        const newTrans = new this.transModel({
          _id: trans_id,
          user: users,
          item: items,
          amount: vnpIpnUrlReqDto.vnp_Amount / 100,
          method: {
            type: MOP.PAYMENT_METHOD.EWALLET,
            name: MOP.EWALLET.VNPAY,
            trans_id: vnpIpnUrlReqDto.vnp_TransactionNo,
            embed_data: {
              bankCode: vnpIpnUrlReqDto.vnp_BankCode,
              bankTransNo: vnpIpnUrlReqDto.vnp_BankTranNo,
              cardType: vnpIpnUrlReqDto.vnp_CardType,
            },
          },
        });
        const session = await this.connection.startSession();
        session.startTransaction();
        try {
          const trans = (await newTrans.save()).$session(session);
          if (!trans) {
            throw new NotFoundException();
          }
          const createGrReqDto: CreateGrReqDto = mapCreateGrReqDto(
            items,
            users,
          );
          if (!group) {
            const createGr = await firstValueFrom(
              this.pkgClient
                .send(kafkaTopic.PKG_MGMT.GROUP.CREATE, createGrReqDto)
                .pipe(timeout(10000)),
            );
            if (createGr.statusCode == HttpStatus.CREATED) {
              await session.commitTransaction();
              result = {
                statusCode: HttpStatus.CREATED,
                message: `Create groups successfully`,
              };
            } else {
              await session.abortTransaction();
              result = {
                statusCode: createGr.statusCode,
                message: createGr.message,
              };
            }
          } else {
            const updateGrPkgReqDto: UpdateGrPkgReqDto = {
              _id: group,
              package: {
                _id: items[0].id,
                duration: items[0].duration,
                noOfMember: items[0].noOfMember,
              },
              user: users,
            };
            const renewGrPkg = await firstValueFrom(
              this.pkgClient
                .send(kafkaTopic.PKG_MGMT.GROUP.ADD_PKG, updateGrPkgReqDto)
                .pipe(timeout(10000)),
            );
            if (renewGrPkg.statusCode == HttpStatus.OK) {
              await session.commitTransaction();
              result = {
                statusCode: HttpStatus.OK,
                message: renewGrPkg.message,
              };
            } else {
              await session.abortTransaction();
              result = {
                statusCode: renewGrPkg.statusCode,
                message: renewGrPkg.message,
              };
            }
          }

          const updateTrxHistReqDto = mapUpdateTrxHistReqDto(
            users,
            trans_id,
            items,
          );
          const res = await firstValueFrom(
            this.usersClient
              .send(kafkaTopic.USERS.UPDATE_TRX, updateTrxHistReqDto)
              .pipe(timeout(10000)),
          );
          if (res.statusCode == HttpStatus.OK) {
            await session.commitTransaction();
            result = {
              statusCode: HttpStatus.OK,
              message: `Create Transaction #${trans_id} successfully`,
            };
          } else {
            await session.abortTransaction();
            result = {
              statusCode: res.statusCode,
              message: res.message,
            };
          }
        } catch (error) {
          await session.abortTransaction();
          result = {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: error.message,
          };
        } finally {
          session.endSession();
          // eslint-disable-next-line no-unsafe-finally
          return Promise.resolve(result);
        }
      } else {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Transaction #${trans_id} failed',
        });
      }
    } else {
      return Promise.resolve({
        statusCode: HttpStatus.BAD_GATEWAY,
        message: `Transaction #${trans_id} callback failed`,
      });
    }
  }
}
function padTo2Digits(num: number) {
  return num.toString().padStart(2, '0');
}
const mapPkgDtoToItemDto = (
  listPkg: PackageDto[],
  cart: Items[],
): ItemDto[] => {
  const ListItem: ItemDto[] = cart.map((i) => {
    const pack = listPkg.find((elem) => elem._id == i.package);
    const item: ItemDto = {
      id: i.package,
      name: pack.name,
      price: Math.round(
        pack.duration >= 12
          ? (pack.price +
              (pack.coefficient ?? 0) * (i.noOfMember - 2) * i.duration) *
              0.7
          : pack.price +
              (pack.coefficient ?? 0) * (i.noOfMember - 2) * i.duration,
      ),
      quantity: i.quantity,
      duration: i.duration ? i.duration : pack.duration,
      noOfMember: i.noOfMember ? i.noOfMember : pack.noOfMember,
    };
    return item;
  });
  return ListItem;
};
const totalPrice = (items: ItemDto[]): number => {
  let total = 0;
  for (const elem of items) {
    total += elem.price * elem.quantity;
  }
  return total;
};
const getTransId = (): string => {
  const date = new Date();
  const time = date.toLocaleTimeString().split(/[\s:]/);
  if (time[3] == 'PM') {
    if (time[0] != '12') {
      time[0] = (parseInt(time[0], 10) + 12).toString();
    }
  } else {
    if (time[0] != '12') {
      time[0] = padTo2Digits(parseInt(time[0], 10));
    } else {
      time[0] = '00';
    }
  }
  return (
    [
      date.getFullYear().toString().substring(2),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join('') +
    '_' +
    [time[0], time[1], time[2]].join('') +
    Math.floor(Math.random() * 1000)
  );
};
const mapZaloPayReqDto = (
  user_id: string,
  items: ItemDto[],
  group_id: string,
  config: any,
): ZPCreateOrderReqDto => {
  const now: number = Date.now();
  const trans_id = getTransId();
  const amount = totalPrice(items);
  const embed_data: EmbedData = {
    redirecturl:
      'https://www.youtube.com/watch?v=q8AzTS4Yq3I&ab_channel=Quy%C3%AAnLouis',
  };
  if (group_id) {
    embed_data['columninfo'] = `{"group_id": "${group_id}"}`;
  }

  const hmacinput = [
    config.app_id,
    trans_id,
    user_id,
    amount,
    now,
    JSON.stringify(embed_data),
    JSON.stringify(items),
  ].join('|');
  const mac: string = createHmac('sha256', config.key1)
    .update(hmacinput)
    .digest('hex');
  const res: ZPCreateOrderReqDto = {
    amount: amount,
    app_id: config.app_id,
    app_time: now,
    app_user: user_id,
    item: JSON.stringify(items),
    app_trans_id: trans_id,
    bank_code: '',
    callback_url: config.callback_URL,
    description: `Megoo - Paymemt for the order #${trans_id}`,
    embed_data: JSON.stringify(embed_data),
    mac: mac,
  };
  return res;
};
const mapZPGetStatusReqDto = (
  app_trans_id: string,
  config: any,
): ZPGetOrderStatusReqDto => {
  const hmacinput = [config.app_id, app_trans_id, config.key1].join('|');
  const mac: string = createHmac('sha256', config.key1)
    .update(hmacinput)
    .digest('hex');
  return {
    app_id: config.app_id,
    app_trans_id: app_trans_id,
    mac: mac,
  };
};
const mapUpdateTrxHistReqDto = (
  app_user: string,
  app_trans_id: string,
  item: ItemDto[],
): UpdateTrxHistReqDto => {
  const updateTrxHistReqDto: UpdateTrxHistReqDto = {
    _id: app_user,
    trx: app_trans_id,
    cart: item.map((x) => {
      const item: Items = {
        package: x.id,
        quantity: x.quantity,
        noOfMember: x.noOfMember,
        duration: x.duration,
      };
      return item;
    }),
  };
  return updateTrxHistReqDto;
};
const mapZPCreateOrderReqDtoToCreateTransReqDto = (
  zpCreateOrderReqDto: ZPCreateOrderReqDto,
): CreateTransReqDto => {
  const createTransReqDto: CreateTransReqDto = {
    _id: zpCreateOrderReqDto.app_trans_id,
    user: zpCreateOrderReqDto.app_user,
    item: JSON.parse(zpCreateOrderReqDto.item),
    amount: zpCreateOrderReqDto.amount,
  };
  return createTransReqDto;
};

const mapCreateGrReqDto = (item: ItemDto[], user: string): CreateGrReqDto => {
  const packages = item.map((elem) => {
    const res = {
      duration: elem.duration,
      noOfMember: elem.noOfMember,
      quantity: elem.quantity,
      _id: elem.id,
    };
    return res;
  });
  const createGrReqDto: CreateGrReqDto = {
    packages: packages,
    member: { user: user },
  };
  return createGrReqDto;
};
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const mapVNPCreateOrderReqDto = (
  ip: string,
  user_id: string,
  items: ItemDto[],
  group_id: string,
  config: any,
): string => {
  const amount = totalPrice(items);
  const trans_id = getTransId();

  const date = new Date();
  const createDate: number = +moment(date)
    .tz('Asia/Ho_Chi_Minh')
    .format('YYYYMMDDHHmmss');
  let orderInfo = `${user_id}#${JSON.stringify(items)}`;
  if (group_id) {
    orderInfo += `#${group_id}`;
  }

  let vnp_Params: { [key: string]: any } = {};
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = config.app_id;
  vnp_Params['vnp_Locale'] = 'vn';
  vnp_Params['vnp_CurrCode'] = 'VND';
  vnp_Params['vnp_TxnRef'] = trans_id;
  vnp_Params['vnp_OrderInfo'] = orderInfo;
  vnp_Params['vnp_OrderType'] = 'other';
  vnp_Params['vnp_Amount'] = amount * 100;
  vnp_Params['vnp_ReturnUrl'] = config.callback_url;
  vnp_Params['vnp_IpAddr'] = ip;
  vnp_Params['vnp_CreateDate'] = createDate;

  let vnpUrl = config.create_order_endpoint;
  vnp_Params = sortObject(vnp_Params);
  const signData = qs.stringify(vnp_Params, { encode: false });
  const hmac = createHmac('sha512', config.key);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  vnp_Params['vnp_SecureHash'] = signed;
  vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });
  return vnpUrl;
};
function sortObject(obj) {
  const sorted = {};
  const str = [];
  let key;
  for (key in obj) {
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
  }
  return sorted;
}
