import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  BaseResDto,
  CartPackage,
  CheckGrSUReqDto,
  CheckoutReqDto,
  CreateUserReqDto,
  ERole,
  GetCartResDto,
  GetUserResDto,
  GetUserSettingResDto,
  IdDto,
  Items,
  MOP,
  RenewGrPkgReqDto,
  UpdateAvatarReqDto,
  UpdateCartReqDto,
  UpdateSettingReqDto,
  UpdateTrxHistReqDto,
  UpdateUserReqDto,
  UserDto,
  UserInfo,
  ZPCheckoutResDto,
  kafkaTopic,
} from '@nyp19vp-be/shared';
import { Types } from 'mongoose';
import { User, UserDocument } from '../../schemas/users.schema';
import {
  CollectionDto,
  CollectionResponse,
  DocumentCollector,
} from '@forlagshuset/nestjs-mongoose-paginate';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { SoftDeleteModel } from 'mongoose-delete';

@Injectable()
export class UsersCrudService implements OnModuleInit {
  constructor(
    @InjectModel(User.name)
    private userModel: SoftDeleteModel<UserDocument>,
    @Inject('TXN_SERVICE') private readonly txnClient: ClientKafka,
    @Inject('PKG_MGMT_SERVICE') private readonly pkgClient: ClientKafka,
  ) {}
  async onModuleInit() {
    this.txnClient.subscribeToResponseOf(kafkaTopic.HEALT_CHECK.TXN);
    for (const key in kafkaTopic.TXN) {
      this.txnClient.subscribeToResponseOf(kafkaTopic.TXN[key]);
    }
    await Promise.all([this.txnClient.connect()]);

    this.pkgClient.subscribeToResponseOf(kafkaTopic.PKG_MGMT.PACKAGE.GET_MANY);

    this.pkgClient.subscribeToResponseOf(kafkaTopic.PKG_MGMT.GROUP.IS_SU);
  }
  async create(createUserReqDto: CreateUserReqDto): Promise<BaseResDto> {
    console.log('users-svc#create-user: ', createUserReqDto);
    const newUser = new this.userModel({
      name: createUserReqDto.name,
      dob: createUserReqDto.dob,
      phone: createUserReqDto.phone,
      email: createUserReqDto.email,
      avatar: createUserReqDto.avatar,
      role: createUserReqDto.role,
    });
    return await newUser
      .save()
      .then((user) => {
        return Promise.resolve({
          statusCode: HttpStatus.CREATED,
          message: `create user #${createUserReqDto.email} successfully`,
          data: user,
        });
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.CONFLICT,
          message: error.message,
        });
      });
  }

  async findAll(
    collectionDto: CollectionDto,
  ): Promise<CollectionResponse<UserDto>> {
    console.log(`users-svc#get-all-users`);
    const collector = new DocumentCollector<UserDocument>(this.userModel);
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

  async getWithDeleted(req): Promise<UserDto[]> {
    const res = await this.userModel.findWithDeleted().exec();
    return res;
  }

  async findInfoById(id: Types.ObjectId): Promise<GetUserResDto> {
    console.log(`users-svc#get-user-by-id:`, id);
    return await this.userModel
      .findById({ _id: id })
      .then((res) => {
        if (!res) {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No user with id: #${id} found`,
            error: 'NOT FOUND',
            user: res,
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `get user #${id} successfully`,
            user: res,
          });
        }
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          user: null,
        });
      });
  }

  async findMany(list_id: IdDto[]): Promise<UserInfo[]> {
    const res = await this.userModel.find({ _id: { $in: list_id } }).exec();
    return res;
  }

  async findSettingById(id: Types.ObjectId): Promise<GetUserSettingResDto> {
    console.log(`users-svc#get-setting-by-id:`, id);
    return await this.userModel
      .findById({ _id: id }, { setting: 1, _id: 0 })
      .then((res) => {
        if (!res) {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No user with id: #${id} found`,
            error: 'NOT FOUND',
            setting: res.setting,
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `get user #${id} successfully`,
            setting: res.setting,
          });
        }
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          setting: null,
        });
      });
  }

  async updateInfo(updateUserReqDto: UpdateUserReqDto): Promise<BaseResDto> {
    const { _id } = updateUserReqDto;
    console.log(`users-svc#udpate-user:`, _id);
    return await this.userModel
      .findByIdAndUpdate(
        { _id: _id },
        {
          name: updateUserReqDto.name,
          dob: updateUserReqDto.dob,
          phone: updateUserReqDto.phone,
        },
      )
      .then(async (res) => {
        if (res) {
          const data = await this.userModel.findById(
            { _id: _id },
            { setting: 0, avatar: 0, cart: 0, trxHist: 0 },
          );
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `update user #${_id} successfully`,
            data: data,
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No user #${_id} found`,
          });
        }
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
        });
      });
  }

  async updateSetting(
    updateSettingReqDto: UpdateSettingReqDto,
  ): Promise<BaseResDto> {
    const { _id } = updateSettingReqDto;
    console.log(`users-svc#udpate-setting:`, _id);
    return await this.userModel
      .findByIdAndUpdate({ _id: _id }, { setting: updateSettingReqDto })
      .then(async (res) => {
        if (res) {
          const data = await this.userModel.findById(
            { _id: _id },
            { setting: 1 },
          );
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `update user #${_id} successfully`,
            data: data,
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No user #${_id} found`,
          });
        }
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
        });
      });
  }

  async updateAvatar(
    updateAvatarReqDto: UpdateAvatarReqDto,
  ): Promise<BaseResDto> {
    const { _id, avatar } = updateAvatarReqDto;
    return await this.userModel
      .findByIdAndUpdate({ _id: _id }, { avatar: avatar })
      .then(async (res) => {
        const data = await this.userModel.findById(_id, { avatar: 1 });
        console.log(data);
        if (res)
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `update user #${_id} successfully`,
            data: data,
          });
        else
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No user #${_id} found`,
          });
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
        });
      });
  }

  async removeUser(id: Types.ObjectId): Promise<BaseResDto> {
    console.log(`users-svc#delete-user:`, id);
    return await this.userModel
      .deleteById(id)
      .then(async (res) => {
        console.log(res);
        if (res) {
          const data = await this.userModel.findById(id);
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `delete user #${id} successfully`,
            data: data,
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No user #${id} found`,
          });
        }
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
        });
      });
  }
  async restoreUser(id: Types.ObjectId): Promise<BaseResDto> {
    console.log(`users-svc#restore-deleted-user:`, id);
    return await this.userModel
      .restore({ _id: id })
      .then(async (res) => {
        const data = await this.userModel.findById(id);
        if (res) {
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `restore deleted user #${id} successfully`,
            data: data,
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No user #${id} found`,
          });
        }
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
        });
      });
  }

  async updateCart(updateCartReqDto: UpdateCartReqDto): Promise<BaseResDto> {
    const { _id, cart } = updateCartReqDto;
    console.log(`update items of user's cart`, cart);
    return await this.userModel
      .findByIdAndUpdate({ _id: _id }, { $set: { cart: cart } })
      .then(async (res) => {
        if (res) {
          const data = await this.userModel.findById(_id, { cart: 1 });
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `updated user #${_id}'s cart successfully`,
            data: data,
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No user #${_id}'s cart found`,
          });
        }
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
        });
      });
  }

  async getCart(id: Types.ObjectId): Promise<GetCartResDto> {
    console.log(`get items from user's cart`, id);
    return await this.userModel
      .findById({ _id: id }, { cart: 1, _id: 0 })
      .then(async (res) => {
        if (res) {
          const list_id = res.cart.map((x) => x.package);
          const pkgs = await firstValueFrom(
            this.pkgClient
              .send(kafkaTopic.PKG_MGMT.PACKAGE.GET_MANY, list_id)
              .pipe(timeout(10000)),
          );
          const result = [];
          const rest = [];
          for (const item of res.cart) {
            const pack = pkgs.find((elem) => elem._id == item.package);
            if (pack) {
              const pkg: CartPackage = {
                _id: item.package,
                name: pack.name,
                duration: item.duration,
                price: Math.round(
                  item.duration >= 12
                    ? (pack.price +
                        (pack.coefficient ?? 0) *
                          (item.noOfMember - 2) *
                          item.duration) *
                        0.7
                    : pack.price +
                        (pack.coefficient ?? 0) *
                          (item.noOfMember - 2) *
                          item.duration,
                ),
                noOfMember: item.noOfMember,
                coefficient: pack.coefficient,
                description: pack.description,
                createdBy: pack.createdBy,
                updatedBy: pack.updatedBy,
                quantity: item.quantity,
              };
              result.push(pkg);
            } else {
              rest.push(item);
            }
          }
          if (rest) {
            let newState = [...res.cart];
            newState = newState.filter((elem) => {
              if (
                rest.some(
                  (item) =>
                    item.package == elem.package &&
                    item.quantity == elem.quantity &&
                    item.duration == elem.duration &&
                    item.noOfMember == elem.noOfMember,
                )
              ) {
                return false;
              } else {
                return true;
              }
            });
            await this.userModel.updateOne(
              { _id: id },
              { $set: { cart: newState } },
            );
          }
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `get user #${id}'s cart successfully`,
            cart: result,
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No items found in user #${id}'s cart`,
            error: 'NOT FOUND',
            cart: null,
          });
        }
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          cart: null,
        });
      });
  }

  async updateTrxHist(
    updateTrxHistReqDto: UpdateTrxHistReqDto,
  ): Promise<BaseResDto> {
    const { _id, trx, cart } = updateTrxHistReqDto;
    console.log(`update items of user's cart`, trx);
    console.log(cart);
    try {
      const user = await this.userModel.findById({ _id: _id });

      if (!user) {
        return Promise.resolve({
          statusCode: HttpStatus.NOT_FOUND,
          message: `No user #${_id} found`,
        });
      } else {
        user.trxHist.push(trx);
        user.cart = user.cart.filter((elem) => {
          if (
            cart.some(
              (item) =>
                item.package == elem.package &&
                item.quantity == elem.quantity &&
                item.duration == elem.duration &&
                item.noOfMember == elem.noOfMember,
            )
          ) {
            return false;
          } else {
            return true;
          }
        });

        await user.save();

        return {
          statusCode: HttpStatus.OK,
          message: `updated user #${_id}'s cart successfully`,
          data: user,
        };
      }
    } catch (error) {
      return Promise.resolve({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }
  async checkout(
    checkoutReqDto: CheckoutReqDto,
  ): Promise<ZPCheckoutResDto | BaseResDto> {
    const { _id, cart, method, ipAddr } = checkoutReqDto;
    console.log(`User #${_id} checkout:`, cart, ipAddr);
    const mop = MOP.KEY[method.type];
    const checkExist = await this.userModel.findById({ _id: _id });
    if (checkExist) {
      const checkItem: boolean = cart.every((elem) =>
        checkExist.cart.some((value) => {
          if (
            value.package == elem.package &&
            value.quantity == elem.quantity &&
            value.duration == elem.duration &&
            value.noOfMember == elem.noOfMember
          )
            return true;
          else return false;
        }),
      );
      if (checkItem) {
        return await firstValueFrom(
          this.txnClient
            .send(mop[method.bank_code], checkoutReqDto)
            .pipe(timeout(10000)),
        );
      } else {
        return Promise.resolve({
          statusCode: HttpStatus.NOT_FOUND,
          message: `No items found in user #${_id}'s cart`,
          order: null,
          trans: null,
        });
      }
    } else {
      return Promise.resolve({
        statusCode: HttpStatus.NOT_FOUND,
        message: `No user #${_id} found`,
        order: null,
        trans: null,
      });
    }
  }
  async renewPkg(
    renewGrPkgReqDto: RenewGrPkgReqDto,
  ): Promise<ZPCheckoutResDto | BaseResDto> {
    const { _id, cart, group, ipAddr, method } = renewGrPkgReqDto;
    const checkGrSUReqDto: CheckGrSUReqDto = { _id: group, user: _id };
    const mop = MOP.KEY[method.type];
    const isSU: boolean = await firstValueFrom(
      this.pkgClient.send(kafkaTopic.PKG_MGMT.GROUP.IS_SU, checkGrSUReqDto),
    );
    if (!isSU) {
      return Promise.resolve({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: `User #${_id} is not Super User. Only Super User can renew or upgrade package`,
        error: 'UNAUTHORIZED',
      });
    } else {
      const cartItem: Items = {
        package: cart.package,
        quantity: 1,
        noOfMember: cart.noOfMember,
        duration: cart.duration,
      };
      const checkoutReqDto: CheckoutReqDto = {
        _id: _id,
        cart: [cartItem],
        group: group,
        ipAddr: ipAddr,
        method: method,
      };
      return await firstValueFrom(
        this.txnClient
          .send(mop[method.bank_code], checkoutReqDto)
          .pipe(timeout(10000)),
      );
    }
  }
  async searchUser(keyword: string): Promise<UserDto[]> {
    return await this.userModel.find({ $text: { $search: keyword } });
  }
  async statistic(req: Request): Promise<BaseResDto> {
    const countWithDeleted = await this.userModel.countWithDeleted({
      role: ERole.user,
    });
    const countDeleted = await this.userModel.countDeleted({
      role: ERole.user,
    });
    const count = await this.userModel.count({ role: ERole.user });
    const countByMonth = await this.userModel.aggregate([
      { $match: { role: ERole.user } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
    ]);
    const period = await this.userModel.aggregate([
      { $match: { role: ERole.user } },
      {
        $group: {
          _id: null,
          minCreatedAt: { $min: '$createdAt' },
          maxCreatedAt: { $max: '$createdAt' },
        },
      },
    ]);
    const data = {
      count: count,
      countDeleted: countDeleted,
      countWithDeleted: countWithDeleted,
      countByMonth: countByMonth,
      period: period,
    };
    if (data) {
      return Promise.resolve({
        statusCode: HttpStatus.OK,
        message: `Statistic users successfully`,
        data: data,
      });
    } else {
      return Promise.resolve({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Statistic users failed`,
      });
    }
  }
}
