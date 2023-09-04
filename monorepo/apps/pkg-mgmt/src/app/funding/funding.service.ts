import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  BaseResDto,
  BillStatus,
  CheckGrSUReqDto,
  ContributorDto,
  CreateFundingReqDto,
  FundingStatus,
  GetFundingResDto,
  GetGrDto_Fund,
  SendReqDto,
  UpdateFundingSttReqDto,
  kafkaTopic,
} from '@nyp19vp-be/shared';
import { Group, GroupDocument } from '../../schemas/group.schema';
import { SoftDeleteModel } from 'mongoose-delete';
import {
  FundHist,
  FundHistDocument,
  Funding,
  FundingDocument,
} from '../../schemas/funding.schema';
import { ClientKafka } from '@nestjs/microservices';
import { BillService } from '../bill/bill.service';
import { Types } from 'mongoose';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class FundingService {
  constructor(
    @InjectModel(Group.name) private grModel: SoftDeleteModel<GroupDocument>,
    @InjectModel(FundHist.name)
    private fundHistModel: SoftDeleteModel<FundHistDocument>,
    @InjectModel(Funding.name)
    private fundingModel: SoftDeleteModel<FundingDocument>,
    @Inject('USERS_SERVICE') private readonly usersClient: ClientKafka,
    private readonly billService: BillService,
  ) {}
  onModuleInit() {
    this.usersClient.subscribeToResponseOf(kafkaTopic.USERS.GET_MANY);
  }
  async create(createFundingDto: CreateFundingReqDto): Promise<BaseResDto> {
    const { _id, createdBy, ...rest } = createFundingDto;
    console.log(`Create funding of group #${_id}`);
    const isSuReq: CheckGrSUReqDto = {
      _id: _id,
      user: createdBy,
    };
    if (!this.isSU(isSuReq)) {
      return Promise.resolve({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: 'UNAUTHORIZED',
        message: `Phải là Super User mới có thể tạo`,
      });
    }
    if (!this.billService.isGrU(_id, createFundingDto.members)) {
      return Promise.resolve({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'BAD REQUEST',
        message: `Người tham gia phải là thành viên nhóm`,
      });
    }
    const newFunding = new this.fundingModel({
      ...rest,
      status: FundingStatus[0],
      createdBy: createdBy,
    });
    return await newFunding.save().then(async (newFund) => {
      return await this.grModel
        .findByIdAndUpdate({ _id: _id }, { $push: { funding: newFund._id } })
        .then((res) => {
          return {
            statusCode: res ? HttpStatus.CREATED : HttpStatus.NOT_FOUND,
            message: res
              ? `Tạo phiếu quản lý quỹ của nhóm ${_id} thành công`
              : `Nhóm #${_id} không tồn tại`,
            data: newFund,
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
  }
  async findById(id: Types.ObjectId): Promise<GetFundingResDto> {
    console.log(`Get funding #${id}`);
    return await this.fundingModel
      .findById(id)
      .populate({ path: 'history', model: 'FundHist' })
      .then(async (res) => {
        return {
          statusCode: res ? HttpStatus.OK : HttpStatus.NOT_FOUND,
          message: res
            ? `Get funding #${id} successfully`
            : `Phiểu quản lí quỹ #${id} không tồn tại`,
          funding: res ? await this.mapFundingModelToGetGrDto_Fund(res) : null,
        };
      })
      .catch((error) => {
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          error: 'INTERNAL SERVER ERROR',
          funding: null,
        };
      });
  }
  async update(updateFundingDto: CreateFundingReqDto): Promise<BaseResDto> {
    const { _id, createdBy, ...rest } = updateFundingDto;
    console.log(`Update funding #${_id}`);
    const isSuReq: CheckGrSUReqDto = {
      _id: _id,
      user: createdBy,
    };
    if (!this.isSU(isSuReq)) {
      return Promise.resolve({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: 'UNAUTHORIZED',
        message: `Phải là Super User mới có thể chỉnh sửa`,
      });
    }
    return await this.fundingModel
      .findByIdAndUpdate(
        { _id: _id },
        {
          $set: {
            ...rest,
            status: setStatus(
              updateFundingDto.ends,
              updateFundingDto.startDate,
            ),
          },
        },
      )
      .then(async (res) => {
        if (res) {
          const data = await this.fundingModel.findById({ _id: _id });
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `Chỉnh sửa phiểu quản lí quỹ ${_id} thành công`,
            data: data,
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `Phiểu quản lí quỹ #${_id} không tồn tại`,
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
  async updateOccurrence(id: Types.ObjectId): Promise<BaseResDto> {
    const task = await this.fundingModel.findById(id);
    if (!task) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Phiểu quản lí quỹ #${id} không tồn tại`,
      };
    }
    if (typeof task.ends === 'number') task.ends--;
    return await this.fundingModel
      .updateOne({ _id: id }, { $set: { end: task.ends } })
      .then(() => {
        return {
          statusCode: HttpStatus.OK,
          message: `Updated funding #${id} occurrences successfully`,
          data: task,
        };
      })
      .catch((error) => {
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
        };
      });
  }
  async addFundHist(id: Types.ObjectId): Promise<BaseResDto> {
    const funding = await this.fundingModel.findById(id);
    if (!funding) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Phiểu quản lí quỹ #${id} không tồn tại`,
      };
    } else {
      const contributors = funding.members.map((member) => {
        const contributorDto: ContributorDto = {
          user: member,
          amount: Math.round(funding.total / funding.members.length),
          status: BillStatus[0],
        };
        return contributorDto;
      });
      const newFundHist = new this.fundHistModel({
        contributors: contributors,
      });
      return await newFundHist.save().then(async (newFund) => {
        return await this.fundingModel
          .findByIdAndUpdate({ _id: id }, { $push: { history: newFund._id } })
          .then(() => {
            return {
              statusCode: HttpStatus.OK,
              message: `Thêm lịch sử nhắc quỹ ${id} thành công`,
              data: newFund,
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
    }
  }
  async updateStt(updateStt: UpdateFundingSttReqDto): Promise<BaseResDto> {
    const { _id, user, status, updatedBy, group } = updateStt;
    console.log(`Update status of funding history`, _id);
    const isSUReq: CheckGrSUReqDto = { _id: group, user: updatedBy };
    if (this.isSU(isSUReq)) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Cần quyền Super User để chỉnh sửa trạng thái',
      };
    }

    const funding = await this.fundHistModel.findById({ _id: _id });
    if (!funding) {
      return Promise.resolve({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Kì thanh toán quỹ ${_id} không tồn tại hoặc đã bị xóa`,
      });
    } else {
      let newState = [...funding.contributors];
      newState = newState.map((data) => {
        if (data.user === user) {
          const updatedData = { ...data, status: status };
          return updatedData;
        }
        return data;
      });
      return await this.fundHistModel
        .updateOne({ _id: _id }, { $set: { contributors: newState } })
        .then(() => {
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: 'Câp nhật trạng thái thành công',
            data: newState,
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
  }
  async sendRequest(sendReqDto: SendReqDto): Promise<BaseResDto> {
    const { group_id, fund_id, to_user, from_user } = sendReqDto;
    console.log(`Send request to ${to_user}`);
    const { statusCode, funding, message } = await this.findById(
      new Types.ObjectId(fund_id),
    );
    if (statusCode != HttpStatus.OK) {
      return {
        statusCode: statusCode,
        message: message,
      };
    } else {
      if (
        funding.members.some((item) => item._id == from_user) &&
        funding.members.some((item) => item._id == to_user)
      ) {
        const isSUReq: CheckGrSUReqDto = { _id: group_id, user: from_user };
        if (this.isSU(isSUReq)) {
          const data = funding.history.map((item) => {
            let debt: number;
            for (const elem of item.contributors) {
              if (to_user == elem.user && elem.status == BillStatus[0])
                debt = elem.amount;
            }
            return { amount: debt, createdAt: item.createdAt };
          });
          return {
            statusCode: HttpStatus.OK,
            message: `Gửi nhắc nhở thành công tới ${to_user}`,
            data: { from_user: from_user, id: fund_id, data: data },
          };
        }
        isSUReq.user = to_user;
        if (this.isSU(isSUReq)) {
          const data = funding.history.map((item) => {
            let debt: number;
            for (const elem of item.contributors) {
              if (from_user == elem.user && elem.status == BillStatus[0])
                debt = elem.amount;
            }
            return { amount: debt, createdAt: item.createdAt };
          });
          return {
            statusCode: HttpStatus.OK,
            message: `Gửi yêu cầu thành công tới Super User ${to_user}`,
            data: { from_user: from_user, id: fund_id, data: data },
          };
        }
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Yêu cầu người gửi hoặc người nhận phải có quyền Super User',
        };
      } else {
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Người gửi và người nhận đều phải tham gia vào quỹ',
        };
      }
    }
  }
  async remove(id: Types.ObjectId): Promise<BaseResDto> {
    console.log(`Remove funding #${id}`);
    return await this.fundingModel
      .deleteById(id)
      .then((res) => {
        return Promise.resolve({
          statusCode: HttpStatus.OK,
          message: `Xóa phiểu quản lí quỹ ${id} thành công`,
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
    return await this.fundingModel
      .restore({ _id: id })
      .then((res) => {
        return Promise.resolve({
          statusCode: HttpStatus.OK,
          message: `Khôi phục phiểu quản lí quỹ ${id} thành công`,
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
  async mapFundingModelToGetGrDto_Fund(model): Promise<GetGrDto_Fund> {
    const { members } = model;
    const list_user = await firstValueFrom(
      this.usersClient
        .send(kafkaTopic.USERS.GET_MANY, members)
        .pipe(timeout(10000)),
    );
    const getGrDto_Fund: GetGrDto_Fund = {
      _id: model._id,
      summary: model.summary,
      description: model.description,
      startDate: model.startDate,
      times: model.times,
      ends: model.ends,
      members: list_user,
      total: model.total,
      history: model.history,
      status: setStatus(model.ends, model.startDate),
      createdBy: model.createdBy,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
    return getGrDto_Fund;
  }

  async isSU(checkGrSUReqDto: CheckGrSUReqDto): Promise<boolean> {
    const { _id, user } = checkGrSUReqDto;
    const isSU = await this.grModel.findOne({
      _id: _id,
      members: { $elemMatch: { user: user, role: 'Super User' } },
    });
    if (isSU) return true;
    return false;
  }
}
const setStatus = (ends, startDate: Date): string => {
  const curDate = new Date();
  if (new Date(startDate) > curDate) return FundingStatus[0];
  if (ends instanceof Date) {
    if (new Date(ends) < curDate) return FundingStatus[2];
    else return FundingStatus[1];
  } else {
    if (ends === 0) return FundingStatus[2];
    else return FundingStatus[1];
  }
};
