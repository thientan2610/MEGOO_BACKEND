import { Inject, Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob, CronTime } from 'cron';
import { TaskService } from '../task.service';
import { Types } from 'mongoose';
import {
  GetGrDto_Task,
  RecurrenceDto,
  State,
  TimeUnit,
  WeekDays,
} from '@nyp19vp-be/shared';
import { SocketGateway } from '../../../socket/socket.gateway';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class CronService {
  constructor(
    @Inject('PKG_MGMT_SERVICE') private readonly packageMgmtClient: ClientKafka,
    private schedulerRegistry: SchedulerRegistry,
    private readonly socketGateway: SocketGateway,
    private readonly taskService: TaskService,
  ) {}

  private timezone = process.env.TZ;

  public scheduleCron(event: string, jobName: string, pattern: string) {
    const cronSvc: CronService = new CronService(
      this.packageMgmtClient,
      this.schedulerRegistry,
      this.socketGateway,
      this.taskService,
    );
    const taskSvc = new TaskService(this.packageMgmtClient, cronSvc);
    const job = new CronJob({
      cronTime: pattern,
      onTick: async function () {
        handleCron(event, jobName, taskSvc, cronSvc);
      },
      timeZone: this.timezone,
      onComplete: () => {
        console.log(`Cron job ${jobName} stopped successfully.`);
      },
    });
    this.schedulerRegistry.addCronJob(jobName, job);
    this.startCron(job);

    console.log(`Cron will execute at ${job.nextDates()} `);
  }

  public getCron(jobName: string) {
    const job = this.schedulerRegistry.getCronJob(jobName);
    const next = job.nextDates();
    const previous = job.lastDate();
    return { job: job, previous: previous, next: next };
  }

  public stopCron(job: CronJob) {
    console.log('Cron stopped successfully');
    job.stop();
  }

  public startCron(job: CronJob) {
    job.start();
  }

  public setCronTime(job: CronJob, pattern: string) {
    const time: CronTime = new CronTime(pattern, this.timezone);
    job.setTime(time);
    console.log('Cron set time successfully');
  }

  public getCrons() {
    const jobs = this.schedulerRegistry.getCronJobs();
    jobs.forEach((value, key, map) => {
      let next;
      try {
        next = value.nextDates();
      } catch (e) {
        next = 'error: next fire date is in the past!';
      }
      console.log(`job: ${key} -> next: ${next}`);
    });
  }

  async sendNoti(event: string, task: GetGrDto_Task): Promise<void> {
    const { createdBy, members, state } = task;
    await this.socketGateway.handleEvent(event, createdBy._id, task);
    if (state == State[1]) {
      for (const member of members) {
        await this.socketGateway.handleEvent(event, member._id, task);
      }
    }
  }
}
export function setCronPattern(
  start: Date,
  recurrence?: RecurrenceDto,
): string {
  const pattern: unknown[] = [
    start.getMinutes(),
    start.getHours(),
    '*',
    '*',
    '*',
  ];
  if (!recurrence || recurrence.unit === TimeUnit[3]) {
    pattern[2] = start.getDate();
    pattern[3] = start.getMonth();
  } else {
    switch (recurrence.unit) {
      case TimeUnit[0]: {
        pattern[2] = everyNthUnit(recurrence);
        break;
      }
      case TimeUnit[1]: {
        pattern[4] = everyWeek(start, recurrence);
        break;
      }
      case TimeUnit[2]: {
        pattern[2] = start.getDate();
        pattern[3] = everyNthUnit(recurrence);
        break;
      }
    }
  }
  return pattern.join(' ');
}
function isPassNthWeek(now: Date, task: GetGrDto_Task, last: Date): boolean {
  const { recurrence, startDate } = task;
  if (recurrence) {
    const { unit, times } = recurrence;
    if (now > startDate && unit == WeekDays[1] && times > 1) {
      const daydiff = (now.getTime() - last.getTime()) / 86400000;
      if (daydiff >= 7 * times || daydiff <= 7 * (times - 1)) return false;
    }
    return true;
  }
  return true;
}
function everyNthUnit(recurrence: RecurrenceDto): string {
  const { times } = recurrence;
  if (times == 1) return '*';
  return `*/${times}`;
}
function everyWeek(start: Date, recurrence: RecurrenceDto): string {
  const { repeatOn } = recurrence;
  if (repeatOn) {
    const dayWeek = repeatOn.map((val) => {
      return WeekDays[val];
    });
    return dayWeek.join(',');
  }
  return start.getDay().toString();
}

async function handleCron(
  event: string,
  jobName: string,
  taskService: TaskService,
  cronService: CronService,
) {
  const now = new Date();
  const taskId = new Types.ObjectId(jobName);
  const { task } = await taskService.findById(taskId);
  const { recurrence } = task;
  const startDate = new Date(task.startDate);
  const { job, next, previous } = cronService.getCron(jobName);

  if (isPassNthWeek(now, task, previous)) {
    cronService.sendNoti(event, task);
    console.log(`Job ${jobName} -> previous: ${previous} - next: ${next}`);
    if (!task.isRepeated) {
      cronService.stopCron(job);
      return;
    }

    now.setSeconds(0, 0);
    startDate.setSeconds(0, 0);
    if (now == startDate) {
      cronService.setCronTime(job, setCronPattern(startDate, recurrence));
    }

    if (recurrence.ends) {
      if (typeof recurrence.ends === 'number')
        await taskService.updateOccurrence(taskId);
      if (
        (recurrence.ends instanceof Date &&
          next.toJSDate() >= new Date(recurrence.ends)) ||
        recurrence.ends === 1
      ) {
        cronService.stopCron(job);
        return;
      }
    }
  }
}
