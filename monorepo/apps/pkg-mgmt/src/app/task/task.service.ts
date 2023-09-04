import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  BaseResDto,
  CreateTaskReqDto,
  GetGrDto_Task,
  GetTaskResDto,
  State,
  TimeUnit,
  UpdateTaskReqDto,
  UpdateTaskStateReqDto,
  kafkaTopic,
} from '@nyp19vp-be/shared';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'mongoose-delete';
import { Task, TaskDocument } from '../../schemas/task.schema';
import { BillService } from '../bill/bill.service';
import { Group, GroupDocument } from '../../schemas/group.schema';
import { Types } from 'mongoose';
import { firstValueFrom, timeout } from 'rxjs';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class TaskService implements OnModuleInit {
  constructor(
    private readonly billService: BillService,
    @InjectModel(Task.name) private taskModel: SoftDeleteModel<TaskDocument>,
    @InjectModel(Group.name) private grModel: SoftDeleteModel<GroupDocument>,
    @Inject('USERS_SERVICE') private readonly usersClient: ClientKafka,
  ) {}
  onModuleInit() {
    this.usersClient.subscribeToResponseOf(kafkaTopic.USERS.GET_MANY);
  }
  async create(createTaskReqDto: CreateTaskReqDto): Promise<BaseResDto> {
    const { _id, createdBy, isRepeated, recurrence, members } =
      createTaskReqDto;
    console.log(`Create task of group #${_id}`);

    const isAuthor = await this.billService.isGrU(_id, [createdBy]);
    let isU = true;
    if (members) isU = await this.billService.isGrU(_id, members);
    if (!isAuthor) {
      return Promise.resolve({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: `MUST be group's member to create task`,
      });
    } else if (!isU) {
      return Promise.resolve({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Members MUST be group's member`,
      });
    } else {
      const newTask = new this.taskModel({
        summary: createTaskReqDto.summary,
        description: createTaskReqDto.description,
        startDate: createTaskReqDto.startDate,
        isRepeated: createTaskReqDto.isRepeated,
        recurrence: isRepeated
          ? {
              times: recurrence.unit == TimeUnit[3] ? 1 : recurrence.times,
              unit: recurrence.unit,
              repeatOn:
                recurrence.unit == TimeUnit[1]
                  ? recurrence.repeatOn
                  : undefined,
              ends: recurrence.ends,
            }
          : undefined,
        members:
          createTaskReqDto.state == State[1]
            ? createTaskReqDto.members
            : undefined,
        state: createTaskReqDto.state,
        createdBy: createTaskReqDto.createdBy,
      });
      return await newTask.save().then(async (saveTask) => {
        return await this.grModel
          .findByIdAndUpdate({ _id: _id }, { $push: { task: saveTask } })
          .then((res) => {
            return Promise.resolve({
              statusCode: res ? HttpStatus.CREATED : HttpStatus.NOT_FOUND,
              message: res
                ? `Created task of group ${_id} successfully`
                : `Group #${_id} not found`,
              data: res ? saveTask : undefined,
            });
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

  async findById(id: Types.ObjectId): Promise<GetTaskResDto> {
    console.log(`Get task #${id}`);
    return this.taskModel
      .findById(id)
      .then(async (res) => {
        return {
          statusCode: res ? HttpStatus.OK : HttpStatus.NOT_FOUND,
          message: res
            ? `Get task #${id} successfully`
            : `Task #${id} not found`,
          task: res ? await this.mapTaskModelToGetGrDto_Task(res) : null,
        };
      })
      .catch((error) => {
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          error: 'INTERNAL SERVER ERROR',
          task: null,
        };
      });
  }
  async mapTaskModelToGetGrDto_Task(
    model,
    owner?: string,
  ): Promise<GetGrDto_Task> {
    const { updatedBy, createdBy, members, ...rest } = model;
    if (owner != undefined && model.state == State[0] && createdBy != owner) {
      return undefined;
    } else {
      const list_others = updatedBy ? [createdBy, updatedBy] : [createdBy];
      const list_id =
        model.state == State[1] && members
          ? members.concat(list_others)
          : list_others;
      const list_user = await firstValueFrom(
        this.usersClient
          .send(kafkaTopic.USERS.GET_MANY, list_id)
          .pipe(timeout(10000)),
      );
      const newMembers = [];
      if (members) {
        for (let i = 0; i < members.length; i++) {
          const user = list_user.find((elem) => elem._id == members[i]);
          newMembers.push(user);
        }
      }
      const result: GetGrDto_Task = {
        _id: model._id,
        summary: model.summary,
        description: model.description,
        isRepeated: model.isRepeated,
        recurrence: model.recurrence,
        members: newMembers,
        startDate: model.startDate,
        state: model.state,
        createdBy: list_user.find((elem) => elem._id == createdBy),
        updatedBy: updatedBy
          ? list_user.find((elem) => elem._id == updatedBy)
          : undefined,
      };
      return result;
    }
  }

  async update(updateTaskReqDto: UpdateTaskReqDto): Promise<BaseResDto> {
    const { _id, isRepeated, recurrence } = updateTaskReqDto;
    console.log(`Update task #${_id}`);
    return await this.taskModel
      .findByIdAndUpdate(
        { _id: _id },
        {
          $set: {
            summary: updateTaskReqDto.summary,
            description: updateTaskReqDto.description,
            startDate: updateTaskReqDto.startDate,
            isRepeated: updateTaskReqDto.isRepeated,
            recurrence: isRepeated
              ? {
                  times: recurrence.times,
                  unit: recurrence.unit,
                  repeatOn:
                    recurrence.unit == 'Week' ? recurrence.repeatOn : undefined,
                  ends: recurrence.ends,
                }
              : undefined,
            updatedBy: updateTaskReqDto.updatedBy,
          },
        },
      )
      .then(async (res) => {
        return {
          statusCode: res ? HttpStatus.OK : HttpStatus.NOT_FOUND,
          message: res
            ? `Update task #${_id} successfully`
            : `Task #${_id} not found`,
          data: res ? await this.taskModel.findById(_id) : null,
        };
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          error: 'INTERNAL SERVER ERROR',
        });
      });
  }

  async updateState(
    updateTaskStateReqDto: UpdateTaskStateReqDto,
  ): Promise<BaseResDto> {
    const { _id, updatedBy } = updateTaskStateReqDto;
    console.log(`Update task #${_id}`);
    const gotTask = await this.taskModel.findById(_id);
    if (!gotTask) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Task #${_id} not found`,
      };
    }
    if (gotTask.createdBy == updatedBy) {
      return await this.taskModel
        .updateOne(
          { _id: _id },
          {
            $set: {
              members:
                updateTaskStateReqDto.state == State[1]
                  ? updateTaskStateReqDto.members
                  : undefined,
              state: updateTaskStateReqDto.state,
              updatedBy: updatedBy,
            },
          },
        )
        .then(() => {
          return {
            statusCode: HttpStatus.OK,
            message: `Update task #${_id}'s state successfully`,
          };
        })
        .catch((error) => {
          return Promise.resolve({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: error.message,
          });
        });
    } else {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No Permission',
      };
    }
  }

  async updateOccurrence(id: Types.ObjectId): Promise<BaseResDto> {
    const task = await this.taskModel.findById(id);
    if (!task) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Task #${id} not found`,
      };
    }
    if (typeof task.recurrence.ends === 'number') task.recurrence.ends--;
    return await this.taskModel
      .updateOne({ _id: id }, { $set: { recurrence: task.recurrence } })
      .then(() => {
        return {
          statusCode: HttpStatus.OK,
          message: `Updated task #${id} occurrences successfully`,
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
  async remove(id: Types.ObjectId): Promise<BaseResDto> {
    console.log(`Remove task #${id}`);
    return await this.taskModel
      .deleteById(id)
      .then((res) => {
        return Promise.resolve({
          statusCode: HttpStatus.OK,
          message: `Remove task ${id} successfully`,
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
    console.log(`Restore task #${id}`);
    return await this.taskModel
      .restore({ _id: id })
      .then((res) => {
        return Promise.resolve({
          statusCode: HttpStatus.OK,
          message: `Restore task ${id} successfully`,
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
}
