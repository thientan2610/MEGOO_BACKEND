import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Bill, BillDocument } from '../../schemas/billing.schema';
import { SoftDeleteModel } from 'mongoose-delete';
import { InjectModel } from '@nestjs/mongoose';
import {
  BaseResDto,
  CreateBillReqDto,
  GetGrDto_Bill,
  GetBillResDto,
  UpdateBillReqDto,
  UpdateBillSttReqDto,
  kafkaTopic,
  BillStatus,
  SendRequestReqDto,
} from '@nyp19vp-be/shared';
import { Group, GroupDocument } from '../../schemas/group.schema';
import { Types } from 'mongoose';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class BillService implements OnModuleInit {
  constructor(
    @InjectModel(Group.name) private grModel: SoftDeleteModel<GroupDocument>,
    @InjectModel(Bill.name) private billModel: SoftDeleteModel<BillDocument>,
    @Inject('USERS_SERVICE') private readonly usersClient: ClientKafka,
  ) {}
  onModuleInit() {
    this.usersClient.subscribeToResponseOf(kafkaTopic.USERS.GET_MANY);
  }
  async create(createBillReqDto: CreateBillReqDto): Promise<BaseResDto> {
    const { _id, borrowers, lender, createdBy } = createBillReqDto;
    const borrow_user = borrowers.map((user) => {
      return user.borrower;
    });
    const isU = await this.isGrU(_id, borrow_user.concat([lender]));
    const isAuthor = await this.isGrU(_id, [createdBy]);
    if (!isAuthor) {
      return Promise.resolve({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: 'UNAUTHORIZED',
        message: `MUST be group's member to create bill`,
      });
    } else if (!isU) {
      return Promise.resolve({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'BAD REQUEST',
        message: `Lender and borrower MUST be group's members`,
      });
    } else if (borrow_user.includes(lender)) {
      return Promise.resolve({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'BAD REQUEST',
        message: `The lender MUST be different from the borrower`,
      });
    } else {
      return await Promise.all(
        borrowers.map(async (borrower) => {
          const newBorrower = {
            borrower: borrower.borrower,
            amount: borrower.amount,
            status: BillStatus[0],
          };
          return newBorrower;
        }),
      ).then(async (listBorrowers) => {
        const newBilling = new this.billModel({
          summary: createBillReqDto.summary,
          date: createBillReqDto.date,
          lender: lender,
          borrowers: listBorrowers,
          description: createBillReqDto.description,
          createdBy: createdBy,
        });
        return await newBilling.save().then(async (newBill) => {
          return await this.grModel
            .findByIdAndUpdate(
              { _id: _id },
              { $push: { billing: newBill._id } },
            )
            .then((res) => {
              return {
                statusCode: res ? HttpStatus.CREATED : HttpStatus.NOT_FOUND,
                message: res
                  ? `Created bill of group ${_id}`
                  : `Group #${_id} not found`,
                data: newBill,
              };
            })
            .catch((error) => {
              return Promise.resolve({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
                error: 'INTERNAL SERVER ERROR',
              });
            });
        });
      });
    }
  }

  async findById(id: Types.ObjectId): Promise<GetBillResDto> {
    console.log(`Get billing #${id}`);
    return await this.billModel
      .findById(id)
      .then(async (res) => {
        return {
          statusCode: res ? HttpStatus.OK : HttpStatus.NOT_FOUND,
          message: res
            ? `Get billing #${id} successfully`
            : `Billing #${id} not found`,
          billing: res ? await this.mapBillModelToGetGrDto_Bill(res) : null,
        };
      })
      .catch((error) => {
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          error: 'INTERNAL SERVER ERROR',
          billing: null,
        };
      });
  }

  async mapBillModelToGetGrDto_Bill(model): Promise<GetGrDto_Bill> {
    const { lender, borrowers, createdBy, updatedBy, ...rest } = model;
    const list_others = [lender, createdBy];
    updatedBy ? list_others.push(updatedBy) : null;
    const list_borrower = borrowers.map((borrower) => {
      return borrower.borrower;
    });
    const list_id = list_borrower.concat(list_others);
    const list_user = await firstValueFrom(
      this.usersClient
        .send(kafkaTopic.USERS.GET_MANY, list_id)
        .pipe(timeout(10000)),
    );
    const newBorrowers = [];
    let total = 0;
    for (let i = 0; i < list_borrower.length; i++) {
      const user = list_user.find((elem) => elem._id == list_borrower[i]);
      const borrow = {
        borrower: user,
        amount: borrowers[i].amount,
        status: borrowers[i].status,
      };
      newBorrowers.push(borrow);
      total += +borrowers[i].amount;
    }
    const list_status = borrowers.map((borrower) => {
      return borrower.status;
    });
    list_status.push(BillStatus[2]);
    const getGrDto_Bill: GetGrDto_Bill = {
      _id: model._id,
      summary: model.summary,
      date: model.date,
      lender: list_user.find((elem) => elem._id == lender),
      borrowers: newBorrowers,
      total: total,
      status: setStatus(list_status),
      description: model.description,
      createdBy: list_user.find((elem) => elem._id == createdBy),
      updatedBy: updatedBy
        ? list_user.find((elem) => elem._id == updatedBy)
        : undefined,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
    return getGrDto_Bill;
  }

  async update(updateBillReqDto: UpdateBillReqDto): Promise<BaseResDto> {
    const { _id, borrowers } = updateBillReqDto;
    console.log(`Update billing #${_id}`);
    const billing = await this.billModel.findById({ _id: _id });
    billing.borrowers.filter((elem) => {
      if (borrowers.some((borrower) => borrower.borrower == elem.borrower)) {
        return true;
      } else {
        return false;
      }
    });
    borrowers.map((borrower) => {
      const idx = billing.borrowers.findIndex(
        (obj) => obj.borrower == borrower.borrower,
      );
      if (idx != -1) {
        billing.borrowers[idx].amount = borrower.amount;
      } else {
        billing.borrowers.push({
          borrower: borrower.borrower,
          amount: borrower.amount,
          status: BillStatus[0],
        });
      }
    });
    return await this.billModel
      .findByIdAndUpdate(
        { _id: _id },
        {
          $set: {
            summary: updateBillReqDto.summary,
            date: updateBillReqDto.date,
            lender: updateBillReqDto.lender,
            description: updateBillReqDto.description,
            borrowers: billing.borrowers,
            updatedBy: updateBillReqDto.updatedBy,
          },
        },
      )
      .then(async (res) => {
        if (res) {
          const data = await this.billModel.findById({ _id: _id });
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `Update bill ${_id} successfully`,
            data: data,
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `Billing #${_id} not found`,
            error: 'NOT FOUND',
          });
        }
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          error: 'INTERNAL SERVER ERROR',
        });
      });
  }
  async updateStt(
    updateBillSttReqDto: UpdateBillSttReqDto,
  ): Promise<BaseResDto> {
    const { _id, updatedBy, borrowers } = updateBillSttReqDto;
    console.log(`Update billing status of group #${_id}`, updateBillSttReqDto);
    const billing = await this.billModel.findById({ _id: _id });
    if (billing) {
      if (updatedBy == billing.lender) {
        let newState = [...billing.borrowers];
        newState = newState.map((data) => {
          const idx = borrowers.find((obj) => obj.borrower == data.borrower);
          if (idx) {
            const updatedData = {
              ...data,
              status: idx.status,
            };
            return updatedData;
          }
          return data;
        });
        return await this.billModel
          .updateOne(
            { _id: _id },
            { $set: { borrowers: newState, updatedBy: updatedBy } },
          )
          .then(() => {
            return Promise.resolve({
              statusCode: HttpStatus.OK,
              message: `Update bill ${_id}' status successfully`,
              data: { lender: billing.lender, borrowers: newState },
            });
          })
          .catch((error) => {
            return Promise.resolve({
              statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
              message: error.message,
              error: 'INTERNAL SERVER ERROR',
            });
          });
      } else {
        return Promise.resolve({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: `No permission`,
          error: 'UNAUTHORIZED',
        });
      }
    } else {
      return Promise.resolve({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Billing #${_id} not found`,
        error: 'NOT FOUND',
      });
    }
  }
  async sendRequest(sendRequestReqDto: SendRequestReqDto): Promise<BaseResDto> {
    const { _id, to_user, from_user } = sendRequestReqDto;
    console.log(`Send billing request #${to_user}`);
    const billing = await this.billModel.findById({ _id: _id });
    if (billing) {
      if (from_user == billing.lender) {
        const idx = billing.borrowers.find((obj) => obj.borrower == to_user);
        if (idx) {
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `Gửi nhắc nhở tới ${to_user} thành công`,
            data: { from_user: from_user, id: _id, data: idx },
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.FORBIDDEN,
            message: `Người nhận không tồn tại trong phiếu nhắc nợ`,
          });
        }
      } else {
        const idx = billing.borrowers.find((obj) => obj.borrower == from_user);
        if (idx) {
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `Gửi yêu cầu tới ${to_user} thành công`,
            data: { from_user: from_user, id: _id, data: idx },
          });
        }
      }
    } else {
      return Promise.resolve({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Phiéu nhắc nợ #${_id} không tồn tại hoặc đã bị xóa`,
        error: 'NOT FOUND',
      });
    }
  }
  async remove(id: Types.ObjectId): Promise<BaseResDto> {
    console.log(`Remove billing #${id}`);
    return await this.billModel
      .deleteById(id)
      .then((res) => {
        return Promise.resolve({
          statusCode: HttpStatus.OK,
          message: `Remove billing ${id} successfully`,
          data: res,
        });
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          error: 'INTERNAL SERVER ERROR',
        });
      });
  }
  async restore(id: Types.ObjectId): Promise<BaseResDto> {
    console.log(`Restore billing #${id}`);
    return await this.billModel
      .restore({ _id: id })
      .then((res) => {
        return Promise.resolve({
          statusCode: HttpStatus.OK,
          message: `Restore billing ${id} successfully`,
          data: res,
        });
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          error: 'INTERNAL SERVER ERROR',
        });
      });
  }
  async isGrU(_id: string, isGrUReqDto: string[]): Promise<boolean> {
    const group = await this.grModel.findOne({ _id: _id }, { members: 1 });
    const members = group.members.map((res) => {
      return res.user;
    });
    for (const elem of isGrUReqDto) {
      if (!members.includes(elem)) {
        return false;
      }
    }
    return true;
  }
}
const setStatus = (borrowers: string[]): string => {
  let isApproved = false;
  for (const status of borrowers) {
    if (status === BillStatus[0]) return BillStatus[0];
    if (status === BillStatus[1]) isApproved = true;
  }
  if (isApproved) return BillStatus[1];
  return BillStatus[2];
};
