import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  OnModuleInit,
  RequestTimeoutException,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import {
  BaseResDto,
  CreateTaskReqDto,
  GetTaskResDto,
  UpdateTaskReqDto,
  UpdateTaskStateReqDto,
  kafkaTopic,
} from '@nyp19vp-be/shared';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { Types } from 'mongoose';
import { CronService, setCronPattern } from './cron/cron.service';

@Injectable()
export class TaskService implements OnModuleInit {
  constructor(
    @Inject('PKG_MGMT_SERVICE') private readonly packageMgmtClient: ClientKafka,
    private readonly cronService: CronService,
  ) {}
  onModuleInit() {
    const taskTopics = Object.values(kafkaTopic.PKG_MGMT.EXTENSION.TASK);

    for (const topic of taskTopics) {
      this.packageMgmtClient.subscribeToResponseOf(topic);
    }

    this.packageMgmtClient.subscribeToResponseOf(
      kafkaTopic.PKG_MGMT.GROUP.GET_BY_ID,
    );
  }

  async create(createTaskReqDto: CreateTaskReqDto): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(
          kafkaTopic.PKG_MGMT.EXTENSION.TASK.CREATE,
          JSON.stringify(createTaskReqDto),
        )
        .pipe(
          timeout(10000),
          catchError(() => {
            throw new RequestTimeoutException();
          }),
        ),
    ).then(async (res) => {
      if (res.statusCode == HttpStatus.CREATED) {
        const pattern = setCronPattern(new Date(res.data.startDate));
        this.cronService.scheduleCron('taskReminder', res.data._id, pattern);
        return res;
      } else {
        throw new HttpException(res.message, res.statusCode);
      }
    });
  }
  async update(updateTaskReqDto: UpdateTaskReqDto): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(
          kafkaTopic.PKG_MGMT.EXTENSION.TASK.UPDATE,
          JSON.stringify(updateTaskReqDto),
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
  async updateState(
    updateTaskStateReqDto: UpdateTaskStateReqDto,
  ): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(
          kafkaTopic.PKG_MGMT.EXTENSION.TASK.UPDATE_STATE,
          JSON.stringify(updateTaskStateReqDto),
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
  async remove(id: Types.ObjectId): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(kafkaTopic.PKG_MGMT.EXTENSION.TASK.DELETE, id)
        .pipe(
          timeout(10000),
          catchError(() => {
            throw new RequestTimeoutException();
          }),
        ),
    ).then((res) => {
      if (res.statusCode == HttpStatus.OK) {
        const { job } = this.cronService.getCron(id.toString());
        this.cronService.stopCron(job);
        return res;
      } else {
        throw new HttpException(res.message, res.statusCode);
      }
    });
  }
  async restore(id: Types.ObjectId): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(kafkaTopic.PKG_MGMT.EXTENSION.TASK.RESTORE, id)
        .pipe(
          timeout(10000),
          catchError(() => {
            throw new RequestTimeoutException();
          }),
        ),
    ).then((res) => {
      if (res.statusCode == HttpStatus.OK) {
        const { job } = this.cronService.getCron(id.toString());
        this.cronService.startCron(job);
        return res;
      } else {
        throw new HttpException(res.message, res.statusCode);
      }
    });
  }
  async findById(id: Types.ObjectId): Promise<GetTaskResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(kafkaTopic.PKG_MGMT.EXTENSION.TASK.GET_BY_ID, id)
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
  async updateOccurrence(id: Types.ObjectId): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(kafkaTopic.PKG_MGMT.EXTENSION.TASK.UPDATE_OCCURRENCE, id)
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
}
