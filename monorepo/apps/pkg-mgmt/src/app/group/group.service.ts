import {
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CreateGrReqDto,
  GetGrResDto,
  GroupDto,
  PackageDto,
  AddGrMbReqDto,
  RmGrMbReqDto,
  UpdateGrPkgReqDto,
  UpdateGrReqDto,
  GetGrsResDto,
  UpdateAvatarReqDto,
  ActivateGrPkgReqDto,
  GrPkgDto,
  CheckGrSUReqDto,
  GetGrDto,
  GetGrDto_Pkg,
  GetGrDto_Memb,
  kafkaTopic,
  UpdateChannelReqDto,
  BaseResDto,
  PaginationParams,
  GetGrDto_Bill,
  ProjectionParams,
  GetGrDto_Todos,
  GetGrByExReqDto,
  GetGrDto_Task,
  PkgStatus,
  GetGrDto_Fund,
} from '@nyp19vp-be/shared';
import { Types } from 'mongoose';
import { Group, GroupDocument } from '../../schemas/group.schema';
import { Package, PackageDocument } from '../../schemas/package.schema';
import {
  CollectionDto,
  CollectionResponse,
  DocumentCollector,
  Pagination,
} from '@forlagshuset/nestjs-mongoose-paginate';
import { SoftDeleteModel } from 'mongoose-delete';
import { v4 } from 'uuid';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { Bill, BillDocument } from '../../schemas/billing.schema';
import { BillService } from '../bill/bill.service';
import { TodosService } from '../todos/todos.service';
import {
  Todo,
  TodoDocument,
  TodoList,
  TodoListDocument,
} from '../../schemas/todos.schema';
import { TaskService } from '../task/task.service';
import { Task, TaskDocument } from '../../schemas/task.schema';
import { FundingService } from '../funding/funding.service';
import {
  FundHist,
  FundHistDocument,
  Funding,
  FundingDocument,
} from '../../schemas/funding.schema';

@Injectable()
export class GroupService implements OnModuleInit {
  constructor(
    @Inject('USERS_SERVICE') private readonly usersClient: ClientKafka,
    @Inject('PROD_MGMT_SERVICE') private readonly prodClient: ClientKafka,
    @InjectModel(Package.name)
    private pkgModel: SoftDeleteModel<PackageDocument>,
    @InjectModel(TodoList.name)
    private todosModel: SoftDeleteModel<TodoListDocument>,
    @InjectModel(Group.name) private grModel: SoftDeleteModel<GroupDocument>,
    @InjectModel(Bill.name) private billModel: SoftDeleteModel<BillDocument>,
    @InjectModel(Todo.name) private todoModel: SoftDeleteModel<TodoDocument>,
    @InjectModel(Task.name) private taskModel: SoftDeleteModel<TaskDocument>,
    @InjectModel(FundHist.name)
    private fundHistModel: SoftDeleteModel<FundHistDocument>,
    @InjectModel(Funding.name)
    private fundingModel: SoftDeleteModel<FundingDocument>,
    private readonly billService: BillService,
    private readonly todosService: TodosService,
    private readonly taskService: TaskService,
    private readonly fundingService: FundingService,
  ) {}
  async onModuleInit() {
    this.prodClient.subscribeToResponseOf(kafkaTopic.PROD_MGMT.init);

    this.usersClient.subscribeToResponseOf(kafkaTopic.HEALT_CHECK.USERS);
    for (const key in kafkaTopic.USERS) {
      this.usersClient.subscribeToResponseOf(kafkaTopic.USERS[key]);
    }
    await Promise.all([this.usersClient.connect()]);
  }
  async create(createGrReqDto: CreateGrReqDto): Promise<BaseResDto> {
    console.log('pkg-mgmt-svc#create-group: ', createGrReqDto);
    const { user } = createGrReqDto.member;
    const listPkg = [];
    for (const elem of createGrReqDto.packages) {
      const pkg = await this.pkgModel.findById({ _id: elem._id });
      if (pkg) {
        for (let i = 0; i < elem.quantity; i++) {
          const grName = `${pkg.name.split(/\s+/).shift()}_${v4()}`;
          const newGr = new this.grModel({
            name: grName,
            members: [{ user: user, role: 'Super User' }],
            packages: [
              {
                package: {
                  _id: elem._id,
                  duration: elem.duration,
                  noOfMember: elem.noOfMember,
                },
                status: PkgStatus[0],
              },
            ],
          });
          listPkg.push(newGr);
        }
      } else {
        throw new NotFoundException();
      }
    }
    return await this.grModel
      .insertMany(listPkg)
      .then(async (res) => {
        return Promise.resolve({
          statusCode: HttpStatus.CREATED,
          message: `create groups successfully`,
          data: res,
        });
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
  ): Promise<CollectionResponse<GroupDto>> {
    console.log('pkg-mgmt-svc#get-all-groups');
    const collector = new DocumentCollector<GroupDocument>(this.grModel);
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

  async findById(projectionParams: ProjectionParams): Promise<GetGrResDto> {
    const { _id, proj } = projectionParams;
    console.log(`pkg-mgmt-svc#get-group #${_id}`);
    return this.grModel
      .findById({ _id: _id }, proj)
      .then(async (res) => {
        if (res) {
          if (proj.billing)
            res = await res.populate({ path: 'billing', model: 'Bill' });
          if (proj.todos)
            res = await res.populate({
              path: 'todos',
              populate: { path: 'todos', model: 'Todo' },
            });
          if (proj.task)
            res = await res.populate({ path: 'task', model: 'Task' });
          if (proj.funding)
            res = await res.populate({
              path: 'funding',
              populate: { path: 'history', model: 'FundHist' },
            });
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `get group #${_id} successfully`,
            group: await this.mapGrModelToGetGrDto(res.toObject()),
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No group #${_id} found`,
            error: 'NOT FOUND',
            group: null,
          });
        }
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          group: null,
        });
      });
  }
  async findWithDeleted(
    paginationParams: PaginationParams,
  ): Promise<GetGrsResDto> {
    console.log(`pkg-mgmt-svc#get-all-groups-with-deleted`);
    const pagination = await this.paginate(paginationParams, {}, true);
    return await this.grModel
      .aggregateWithDeleted(this.aggregatePipeline(paginationParams))
      .then(async (res) => {
        const groups: GetGrDto[] = await Promise.all(
          res.map(async (gr) => {
            await this.todoModel.populate(gr.todos, {
              path: 'todos',
            });

            return await this.mapGrModelToGetGrDto(gr);
          }),
        );
        return Promise.resolve({
          statusCode: HttpStatus.OK,
          message: `get all groups with deleted successfully`,
          groups: groups,
          pagination: pagination,
        });
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          groups: null,
          pagination: pagination,
        });
      });
  }
  async findByUser(paginationParams: PaginationParams): Promise<GetGrsResDto> {
    const { user, role } = paginationParams;
    console.log(`pkg-mgmt-svc#get-groups-user-id #${user}`);
    const query = { user: user };
    role != undefined ? (query['role'] = role) : null;
    const pagination = await this.paginate(paginationParams, query, false);
    return await this.grModel
      .aggregate(this.aggregatePipeline(paginationParams))
      .then(async (res) => {
        const groups: GetGrDto[] = await Promise.all(
          res.map(async (gr) => {
            await this.todoModel.populate(gr.todos, {
              path: 'todos',
            });
            await this.fundHistModel.populate(gr.funding, {
              path: 'history',
            });
            return await this.mapGrModelToGetGrDto(gr, user);
          }),
        );
        return Promise.resolve({
          statusCode: HttpStatus.OK,
          message: `get groups by userId #${user} successfully`,
          groups: groups,
          pagination: pagination,
        });
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          groups: null,
          pagination: pagination,
        });
      });
  }
  private aggregatePipeline(paginationParams: PaginationParams) {
    const { user, role, sorter, limit, page, proj } = paginationParams;
    const query = {};
    user != undefined ? (query['user'] = user) : null;
    role != undefined ? (query['role'] = role) : null;
    const documentSkip = page == 0 ? 0 : page * limit;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [
      { $match: { members: { $elemMatch: query } } },
      { $skip: documentSkip },
      { $limit: limit },
      { $sort: sorter },
      { $project: proj },
    ];
    if (proj.billing) {
      const billLookup = {
        $lookup: {
          from: this.billModel.collection.name,
          localField: 'billing',
          foreignField: '_id',
          pipeline: [{ $match: { $expr: { $eq: ['$deleted', false] } } }],
          as: 'billing',
        },
      };
      pipeline.push(billLookup);
    }
    if (proj.todos) {
      const todosLookup = {
        $lookup: {
          from: this.todosModel.collection.name,
          localField: 'todos',
          foreignField: '_id',
          pipeline: [{ $match: { $expr: { $eq: ['$deleted', false] } } }],
          as: 'todos',
        },
      };
      pipeline.push(todosLookup);
    }
    if (proj.task) {
      const taskLookup = {
        $lookup: {
          from: this.taskModel.collection.name,
          localField: 'task',
          foreignField: '_id',
          pipeline: [{ $match: { $expr: { $eq: ['$deleted', false] } } }],
          as: 'task',
        },
      };
      pipeline.push(taskLookup);
    }
    if (proj.funding) {
      const fundLookup = {
        $lookup: {
          from: this.fundingModel.collection.name,
          localField: 'funding',
          foreignField: '_id',
          pipeline: [{ $match: { $expr: { $eq: ['$deleted', false] } } }],
          as: 'funding',
        },
      };
      pipeline.push(fundLookup);
    }
    return pipeline;
  }
  async update(updateGrReqDto: UpdateGrReqDto): Promise<BaseResDto> {
    const { _id } = updateGrReqDto;
    console.log(`pkg-mgmt-svc#update-group #${_id}'s name`);
    return await this.grModel
      .updateOne({ _id: _id }, { name: updateGrReqDto.name })
      .then(async (res) => {
        if (res.matchedCount && res.modifiedCount) {
          const data = await this.grModel.findById(_id, { name: 1 });
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `update group #${_id}'s name successfully`,
            data: data,
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No group #${_id} found`,
            error: 'NOT FOUND',
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

  async remove(id: Types.ObjectId): Promise<BaseResDto> {
    console.log(`pkg-mgmt-svc#delete-group #${id}`);
    return await this.grModel
      .deleteById(id)
      .then(async (res) => {
        if (res) {
          const data = await this.grModel
            .findOneWithDeleted({ _id: id })
            .populate({
              path: 'packages',
              populate: {
                path: 'package',
                model: 'Package',
              },
            });
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `delete group #${id} successfully`,
            data: data,
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No group #${id} found`,
            error: 'NOT FOUND',
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

  async restore(id: Types.ObjectId): Promise<BaseResDto> {
    console.log(`pkg-mgmt-svc#Restore-deleted-group #${id}`);
    return await this.grModel
      .restore({ _id: id })
      .then(async (res) => {
        if (res) {
          const data = await this.grModel.findById(id).populate({
            path: 'packages',
            populate: {
              path: 'package',
              model: 'Package',
            },
          });
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `Restore deleted group #${id} successfully`,
            data: data,
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No group #${id} found`,
            error: 'NOT FOUND',
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

  async addMemb(updateGrMbReqDto: AddGrMbReqDto): Promise<BaseResDto> {
    const id = updateGrMbReqDto._id;
    const user_id = updateGrMbReqDto.user;
    console.log(`pkg-mgmt-svc#add-new-member #${user_id} to-group #${id}`);
    const { _id } = updateGrMbReqDto;
    return await this.grModel
      .findOne({ _id: _id }, { members: { $elemMatch: { user: user_id } } })
      .then(async (checkMemb) => {
        if (checkMemb) {
          if (!checkMemb.members.length) {
            return await this.grModel
              .updateOne(
                { _id: _id },
                {
                  $addToSet: {
                    members: {
                      user: user_id,
                      role: 'User',
                      addedBy: updateGrMbReqDto.addedBy,
                    },
                  },
                },
              )
              .then(async (res) => {
                if (res.matchedCount && res.modifiedCount) {
                  const data = await this.grModel.findById(_id, { members: 1 });
                  return Promise.resolve({
                    statusCode: HttpStatus.OK,
                    message: `add new member #${user_id} to group #${id} successfully`,
                    data: data,
                  });
                }
              })
              .catch((error) => {
                return Promise.resolve({
                  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                  message: error.message,
                });
              });
          } else {
            return Promise.resolve({
              statusCode: HttpStatus.CONFLICT,
              message: `DUPLICATE_KEY: User #${user_id} already exists`,
              error: 'DUPLICATE KEY ERROR',
            });
          }
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No group #${id} found`,
            error: 'NOT FOUND',
          });
        }
      });
  }
  async rmMemb(updateGrMbReqDto: RmGrMbReqDto): Promise<BaseResDto> {
    const user_id = updateGrMbReqDto.user;
    const { _id } = updateGrMbReqDto;
    console.log(`pkg-mgmt-svc#remove-member #${user_id}-from-group #${_id}`);

    return await this.grModel
      .findOne({ _id: _id, members: { $elemMatch: { user: user_id } } })
      .then(async (checkExists) => {
        if (checkExists) {
          if (checkExists.members.length > 1)
            if (checkExists.members[0].role != 'Super User') {
              return await this.grModel
                .updateOne(
                  { _id: _id },
                  { $pull: { members: { user: user_id } } },
                )
                .then(async (res) => {
                  if (res.matchedCount && res.modifiedCount) {
                    const data = await this.grModel.findById(_id, {
                      members: 1,
                    });
                    return Promise.resolve({
                      statusCode: HttpStatus.OK,
                      message: `remove member #${user_id} from group #${_id} successfully`,
                      data: data,
                    });
                  }
                })
                .catch((error) => {
                  return Promise.resolve({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message,
                  });
                });
            } else {
              const membs = checkExists.members.filter(
                (item) => item.user != user_id,
              );
              membs[0].role = 'Super User';
              return await this.grModel
                .updateOne({ _id: _id }, { $set: { members: membs } })
                .then(async (res) => {
                  if (res.matchedCount && res.modifiedCount) {
                    const data = await this.grModel.findById(_id, {
                      members: 1,
                    });
                    await this.grModel.updateOne(
                      { _id: _id },
                      { $set: { members: data.members } },
                    );

                    return Promise.resolve({
                      statusCode: HttpStatus.OK,
                      message: `remove member #${user_id} from group #${_id} successfully`,
                      data: data,
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
          else if (checkExists.members.length == 1) {
            if (checkExists.members[0].role == 'Super User') {
              return Promise.resolve({
                statusCode: HttpStatus.METHOD_NOT_ALLOWED,
                message: `Not allowed to remove Super User #${user_id} from group`,
                error: 'METHOD NOT ALLOWED',
              });
            }
          } else if (checkExists.members.length == 0) {
            return Promise.resolve({
              statusCode: HttpStatus.NOT_FOUND,
              message: `No member #${user_id} found in group #${_id}`,
              error: 'NOT FOUND',
            });
          }
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No group #${_id} found`,
            error: 'NOT FOUND',
          });
        }
      });
  }
  async rmPkg(updateGrPkgReqDto: UpdateGrPkgReqDto): Promise<BaseResDto> {
    const id = updateGrPkgReqDto._id;
    console.log(`pkg-mgmt-svc#remove-package-from-group #${id}`);
    const { _id } = updateGrPkgReqDto;
    return await this.grModel
      .findByIdAndUpdate(
        { _id: _id },
        { $pull: { packages: updateGrPkgReqDto.package } },
      )
      .then(async (res) => {
        if (res) {
          const data = await this.grModel
            .findById(id, { packages: 1 })
            .populate({
              path: 'packages',
              populate: {
                path: 'package',
                model: 'Package',
              },
            });
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `remove package from group #${id} successfully`,
            data: data,
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No group #${id} found`,
            error: 'NOT FOUND',
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
  async addPkg(updateGrPkgReqDto: UpdateGrPkgReqDto): Promise<BaseResDto> {
    const { _id, user } = updateGrPkgReqDto;
    console.log(`pkg-mgmt-svc#add-new-package-to-group #${_id}`);
    const grPkgs = await this.grModel.findOne(
      {
        _id: _id,
        packages: {
          $elemMatch: { status: PkgStatus[1] },
        },
      },
      { packages: 1 },
    );
    if (grPkgs) {
      const notAcitivatedPkg = grPkgs.packages.filter(
        (elem) => elem.status == PkgStatus[0] || elem.status == PkgStatus[1],
      );
      const endDateArray = notAcitivatedPkg.map((x) => x.endDate);
      const start: Date = maxDate(endDateArray);
      const end: Date = addDays(start, updateGrPkgReqDto.package.duration * 30);
      const pkg: GrPkgDto = {
        package: updateGrPkgReqDto.package,
        startDate: start,
        endDate: end,
        status: setStatus(start, end),
      };
      return await this.grModel
        .findByIdAndUpdate(
          {
            _id: _id,
            members: { $elemMatch: { user: user, role: 'Super User' } },
          },
          { $addToSet: { packages: pkg } },
        )
        .then(async (res) => {
          if (res) {
            const data = await this.grModel
              .findById(_id, { packages: 1 })
              .populate({
                path: 'packages',
                populate: {
                  path: 'package',
                  model: 'Package',
                },
              });
            return Promise.resolve({
              statusCode: HttpStatus.OK,
              message: `Renewed/upgraded package in group #${_id} successfully`,
              data: data,
            });
          } else {
            return Promise.resolve({
              statusCode: HttpStatus.UNAUTHORIZED,
              message: `Must be super user to renew/upgrade package`,
              error: 'UNAUTHORIZED',
            });
          }
        })
        .catch((error) => {
          return Promise.resolve({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: error.message,
          });
        });
    } else {
      return Promise.resolve({
        statusCode: HttpStatus.NOT_FOUND,
        message: `No group #${_id} found`,
        error: 'NOT FOUND',
      });
    }
  }
  async updateAvatar(
    updateAvatarReqDto: UpdateAvatarReqDto,
  ): Promise<BaseResDto> {
    const { _id, avatar } = updateAvatarReqDto;
    return await this.grModel
      .findByIdAndUpdate({ _id: _id }, { avatar: avatar })
      .then(async (res) => {
        const data = await this.grModel.findById(_id, { avatar: 1 });
        if (res)
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `update group #${_id}'s avatar successfully`,
            data: data,
          });
        else
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No group #${_id} found`,
          });
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
        });
      });
  }
  async updateChannel(
    updateChannelReqDto: UpdateChannelReqDto,
  ): Promise<BaseResDto> {
    const { _id, channel } = updateChannelReqDto;
    return await this.grModel
      .findByIdAndUpdate({ _id: _id }, { channel: channel })
      .then(async (res) => {
        const data = await this.grModel.findById(_id, { channel: 1 });
        if (res)
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `update group #${_id}'s avatar successfully`,
            data: data,
          });
        else
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No group #${_id} found`,
          });
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
        });
      });
  }
  async activatePkg(
    activateGrPkgReqDto: ActivateGrPkgReqDto,
  ): Promise<BaseResDto> {
    const { _id, user } = activateGrPkgReqDto;
    const activatedPkg = await this.grModel.findOne({
      _id: _id,
      packages: { $elemMatch: { status: PkgStatus[1] } },
    });
    if (!activatedPkg) {
      const start: Date = new Date();
      const end: Date = addDays(
        start,
        activateGrPkgReqDto.package.duration * 30,
      );
      return await this.grModel
        .findByIdAndUpdate(
          {
            _id: _id,
            package: {
              $elemMatch: {
                package: activateGrPkgReqDto.package,
                status: PkgStatus[0],
              },
            },
            members: { $elemMatch: { user: user, role: 'Super User' } },
          },
          {
            $set: {
              'packages.$[].startDate': start,
              'packages.$[].endDate': end,
              'packages.$[].status': setStatus(start, end),
            },
          },
        )
        .then(async (res) => {
          const data = await this.grModel.findById(
            { _id: _id },
            { packages: 1 },
          );
          if (res) {
            const init = await firstValueFrom(
              this.prodClient.send(kafkaTopic.PROD_MGMT.init, { id: _id }),
            );
            if (init.statusCode == HttpStatus.CREATED) {
              return Promise.resolve({
                statusCode: HttpStatus.OK,
                message: `Activated package #${activateGrPkgReqDto.package._id} in  group #${_id}`,
                data: data,
              });
            } else {
              return init;
            }
          } else {
            return Promise.resolve({
              statusCode: HttpStatus.NOT_FOUND,
              message: `Group #${_id} not found`,
            });
          }
        })
        .catch((error) => {
          return Promise.resolve({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: error.message,
          });
        });
    } else {
      return Promise.resolve({
        statusCode: HttpStatus.CONFLICT,
        message: 'Already have an activated package',
      });
    }
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
  async findByExtension(
    getGrByExReqDto: GetGrByExReqDto,
  ): Promise<GetGrResDto> {
    const { _id, extension } = getGrByExReqDto;
    console.log(`Get group by extension #${_id}`);
    const query = {};
    query[extension] = new Types.ObjectId(_id);
    const group = await this.grModel.findOne(query).exec();
    const projectionParams: ProjectionParams = {
      _id: group._id,
      proj: { members: true },
    };
    return await this.findById(projectionParams);
  }
  private async paginate(
    params: PaginationParams,
    query,
    deleted: boolean,
  ): Promise<Pagination> {
    let count: number;
    if (deleted) {
      count = await this.grModel.countWithDeleted(query);
    } else {
      count = await this.grModel.count(query);
    }

    const pagination: Pagination = {
      total: count,
      page: params.page,
      limit: params.limit,
      next:
        (params.page + 1) * params.limit >= count ? undefined : params.page + 1,
      prev: params.page == 0 ? undefined : params.page - 1,
    };

    return pagination;
  }
  async mapGrModelToGetGrDto_Pkg(model): Promise<GetGrDto_Pkg[]> {
    if (model.packages) {
      const result = model.packages.map(async (elem) => {
        const pkg: PackageDto = await this.pkgModel.findOneWithDeleted({
          _id: elem.package._id,
        });
        pkg.duration = elem.package.duration;
        pkg.noOfMember = elem.package.noOfMember;
        const packages: GetGrDto_Pkg = {
          package: pkg,
          startDate: elem.startDate ? new Date(elem.startDate) : undefined,
          endDate: elem.endDate ? new Date(elem.endDate) : undefined,
          status:
            elem.startDate && elem.endDate
              ? setStatus(elem.startDate, elem.endDate)
              : PkgStatus[0],
        };
        return packages;
      });
      return await Promise.all(result);
    }
    return undefined;
  }
  async mapGrModelToGetGrDto_Memb(model): Promise<GetGrDto_Memb[]> {
    if (model.members) {
      const list_id = model.members.map((member) => {
        return member.user;
      });
      const list_user = await firstValueFrom(
        this.usersClient
          .send(kafkaTopic.USERS.GET_MANY, list_id)
          .pipe(timeout(10000)),
      );
      const result = model.members.map(async (elem) => {
        const users: GetGrDto_Memb = {
          user: list_user.find((user) => user._id == elem.user),
          role: elem.role,
          addedBy: list_user.find((user) => user._id == elem.addedBy),
        };
        return users;
      });
      return await Promise.all(result);
    }
    return undefined;
  }
  async mapGrModelToGetGrDto_Bill(model): Promise<GetGrDto_Bill[]> {
    if (model.billing) {
      const result = model.billing.map(async (bill) => {
        return await this.billService.mapBillModelToGetGrDto_Bill(bill);
      });
      return await Promise.all(result);
    }
    return undefined;
  }
  async mapGrModelToGetGrDto_Todos(
    model,
    owner?: string,
  ): Promise<GetGrDto_Todos[]> {
    if (model.todos) {
      const result = model.todos.map(async (todo) => {
        return await this.todosService.mapTodosModelToGetGrDto_Todos(
          todo,
          owner,
        );
      });
      return await Promise.all(result);
    }
    return undefined;
  }
  async mapGrModelToGetGrDto_Fund(model): Promise<GetGrDto_Fund[]> {
    if (model.funding) {
      const result = model.funding.map(async (fund) => {
        return await this.fundingService.mapFundingModelToGetGrDto_Fund(fund);
      });
      return await Promise.all(result);
    }
    return undefined;
  }
  async mapGrModelToGetGrDto_Task(
    model,
    owner?: string,
  ): Promise<GetGrDto_Task[]> {
    if (model.task) {
      const result = model.task.map(async (task) => {
        return await this.taskService.mapTaskModelToGetGrDto_Task(task, owner);
      });
      return await Promise.all(result);
    }
    return undefined;
  }
  async mapGrModelToGetGrDto(model, owner?: string): Promise<GetGrDto> {
    const result: GetGrDto = {
      _id: model._id,
      name: model.name,
      avatar: model.avatar,
      channel: model.channel,
      billing: await this.mapGrModelToGetGrDto_Bill(model),
      funding: await this.mapGrModelToGetGrDto_Fund(model),
      todos: await this.mapGrModelToGetGrDto_Todos(model, owner),
      task: await this.mapGrModelToGetGrDto_Task(model, owner),
      packages: await this.mapGrModelToGetGrDto_Pkg(model),
      members: await this.mapGrModelToGetGrDto_Memb(model),
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deleted: model.deleted,
      deletedAt: model.deletedAt,
    };
    return result;
  }
}
const setStatus = (startDate: Date, endDate: Date): string => {
  const now = new Date();
  if (startDate > now) return PkgStatus[0];
  else if (now < endDate) return PkgStatus[1];
  else return PkgStatus[2];
};
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const maxDate = (dates: Date[]) => new Date(Math.max(...dates.map(Number)));
