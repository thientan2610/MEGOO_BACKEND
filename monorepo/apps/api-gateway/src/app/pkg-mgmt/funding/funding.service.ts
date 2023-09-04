import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import {
  BaseResDto,
  BillStatus,
  CreateFundingReqDto,
  GetFundingResDto,
  GetGrDto_Fund,
  SendReqDto,
  UpdateFundingSttReqDto,
  kafkaTopic,
} from '@nyp19vp-be/shared';
import { SocketGateway } from '../../socket/socket.gateway';
import { ClientKafka } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { Types } from 'mongoose';
import { CronJob, CronTime } from 'cron';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class FundingService {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    @Inject('PKG_MGMT_SERVICE') private readonly packageMgmtClient: ClientKafka,
    private readonly socketGateway: SocketGateway,
  ) {}
  private timezone = process.env.TZ;
  onModuleInit() {
    const fundTopics = Object.values(kafkaTopic.PKG_MGMT.FUNDING);

    for (const topic of fundTopics) {
      this.packageMgmtClient.subscribeToResponseOf(topic);
    }
  }
  async create(createFundingDto: CreateFundingReqDto): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(
          kafkaTopic.PKG_MGMT.FUNDING.CREATE,
          JSON.stringify(createFundingDto),
        )
        .pipe(
          timeout(10000),
          catchError(() => {
            throw new RequestTimeoutException();
          }),
        ),
    ).then(async (res) => {
      if (res.statusCode == HttpStatus.CREATED) {
        const pattern = setCronPattern(
          new Date(res.data.startDate),
          res.data.times,
        );
        this.scheduleCron('funding', res.data._id, pattern);
        return res;
      } else {
        throw new HttpException(res.message, res.statusCode);
      }
    });
  }

  async findById(id: Types.ObjectId): Promise<GetFundingResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(kafkaTopic.PKG_MGMT.FUNDING.GET_BY_ID, id)
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

  async update(updateFundingReqDto: CreateFundingReqDto): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(
          kafkaTopic.PKG_MGMT.FUNDING.UPDATE,
          JSON.stringify(updateFundingReqDto),
        )
        .pipe(
          timeout(10000),
          catchError(() => {
            throw new RequestTimeoutException();
          }),
        ),
    ).then(async (res) => {
      if (res.statusCode == HttpStatus.OK) {
        return res;
      } else {
        throw new HttpException(res.message, res.statusCode);
      }
    });
  }

  async updateStt(updateStt: UpdateFundingSttReqDto): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(kafkaTopic.PKG_MGMT.FUNDING.UPDATE_STT, JSON.stringify(updateStt))
        .pipe(
          timeout(10000),
          catchError(() => {
            throw new RequestTimeoutException();
          }),
        ),
    ).then(async (res) => {
      if (res.statusCode == HttpStatus.OK) {
        return res;
      } else {
        throw new HttpException(res.message, res.statusCode);
      }
    });
  }

  async remove(id: Types.ObjectId): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient.send(kafkaTopic.PKG_MGMT.FUNDING.DELETE, id).pipe(
        timeout(10000),
        catchError(() => {
          throw new RequestTimeoutException();
        }),
      ),
    ).then((res) => {
      if (res.statusCode == HttpStatus.OK) {
        const { job } = this.getCron(id.toString());
        this.stopCron(job);
        return res;
      } else {
        throw new HttpException(res.message, res.statusCode);
      }
    });
  }

  async restore(id: Types.ObjectId): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient.send(kafkaTopic.PKG_MGMT.FUNDING.RESTORE, id).pipe(
        timeout(10000),
        catchError(() => {
          throw new RequestTimeoutException();
        }),
      ),
    ).then((res) => {
      if (res.statusCode == HttpStatus.OK) {
        const { job } = this.getCron(id.toString());
        this.startCron(job);
        return res;
      } else {
        throw new HttpException(res.message, res.statusCode);
      }
    });
  }

  async updateOccurrence(id: Types.ObjectId): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(kafkaTopic.PKG_MGMT.FUNDING.UPDATE_OCCURRENCE, id)
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

  async sendRequest(sendReqDto: SendReqDto): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(kafkaTopic.PKG_MGMT.FUNDING.SEND_REQ, JSON.stringify(sendReqDto))
        .pipe(
          timeout(10000),
          catchError(() => {
            throw new RequestTimeoutException();
          }),
        ),
    ).then(async (res) => {
      if (res.statusCode == HttpStatus.OK) {
        await this.socketGateway.handleEvent(
          'funding_req',
          sendReqDto.to_user,
          res?.data,
        );
        return res;
      } else {
        throw new HttpException(res.message, res.statusCode);
      }
    });
  }

  async addFundHist(id: Types.ObjectId): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(kafkaTopic.PKG_MGMT.FUNDING.ADD_HISTORY, id)
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

  async sendNoti(
    event: string,
    funding: GetGrDto_Fund,
    now: Date,
  ): Promise<void> {
    const { members } = funding;
    for (const member of members) {
      const message = funding.history.map((item) => {
        let debt: number;
        for (const elem of item.contributors) {
          if (member._id == elem.user && elem.status == BillStatus[0])
            debt = elem.amount;
        }
        return { amount: debt, createdAt: item.createdAt };
      });
      message.push({
        amount: Math.round(funding.total / funding.members.length),
        createdAt: now,
      });
      await this.socketGateway.handleEvent(event, member._id, message);
    }
  }
  scheduleCron(event: string, jobName: string, pattern: string) {
    const job = new CronJob({
      cronTime: pattern,
      onTick: async () => {
        this.handleCron(event, jobName);
      },
      timeZone: this.timezone || 'Asia/Ho_Chi_Minh',
      onComplete: () => {
        console.log(`Cron job ${jobName} stopped successfully.`);
      },
    });
    this.schedulerRegistry.addCronJob(jobName, job);
    this.startCron(job);
    console.log(`Cron will execute at ${job.nextDates()} `);
  }

  startCron(job: CronJob) {
    job.start();
  }

  stopCron(job: CronJob) {
    console.log('Cron stopped successfully');
    job.stop();
  }

  setCronTime(job: CronJob, pattern: string) {
    const time: CronTime = new CronTime(pattern, this.timezone);
    job.setTime(time);
    console.log('Cron set time successfully');
  }

  getCron(jobName: string) {
    const job = this.schedulerRegistry.getCronJob(jobName);
    const next = job.nextDates();
    const previous = job.lastDate();
    return { job: job, previous: previous, next: next };
  }

  async handleCron(event: string, jobName: string) {
    const now = new Date();
    const fundId = new Types.ObjectId(jobName);
    const { funding } = await this.findById(fundId);
    const { ends, times } = funding;
    const startDate = new Date(funding.startDate);
    const { job, next, previous } = this.getCron(jobName);

    await this.addFundHist(fundId);
    this.sendNoti(event, funding, now);
    console.log(
      `Job ${jobName} of funding -> previous: ${previous} - next: ${next}`,
    );

    now.setSeconds(0, 0);
    startDate.setSeconds(0, 0);
    if (now == startDate) {
      this.setCronTime(job, setCronPattern(startDate, times));
    }

    if (ends instanceof Date) {
      if (new Date(ends) <= next.toJSDate()) {
        this.stopCron(job);
        return;
      }
    } else {
      if (ends <= 1) {
        this.stopCron(job);
        return;
      } else {
        await this.updateOccurrence(fundId);
        return;
      }
    }
  }
}
function setCronPattern(start: Date, times: number): string {
  const pattern: unknown[] = [
    start.getMinutes(),
    start.getHours(),
    start.getDate(),
    `*/${times}`,
    '*',
  ];
  return pattern.join(' ');
}
