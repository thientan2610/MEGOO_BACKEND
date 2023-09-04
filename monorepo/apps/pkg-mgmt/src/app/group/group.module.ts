import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from '../../schemas/group.schema';
import { Package, PackageSchema } from '../../schemas/package.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Bill, BillSchema } from '../../schemas/billing.schema';
import { BillModule } from '../bill/bill.module';
import { TodosModule } from '../todos/todos.module';
import {
  Todo,
  TodoList,
  TodoListSchema,
  TodoSchema,
} from '../../schemas/todos.schema';
import { TaskModule } from '../task/task.module';
import { Task, TaskSchema } from '../../schemas/task.schema';
import { FundingModule } from '../funding/funding.module';
import {
  FundHist,
  FundHistSchema,
  Funding,
  FundingSchema,
} from '../../schemas/funding.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Group.name, schema: GroupSchema },
      { name: Bill.name, schema: BillSchema },
      { name: Package.name, schema: PackageSchema },
      { name: TodoList.name, schema: TodoListSchema },
      { name: Todo.name, schema: TodoSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Funding.name, schema: FundingSchema },
      { name: FundHist.name, schema: FundHistSchema },
    ]),
    ClientsModule.register([
      {
        name: 'USERS_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'users' + 'gr-crud' + 'users',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'users-consumer' + 'gr-crud' + 'users',
          },
        },
      },
      {
        name: 'PROD_MGMT_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'prod-mgmt' + 'gr-crud' + 'prod-mgmt',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'prod-mgmt-consumer' + 'gr-crud' + 'prod-mgmt',
          },
        },
      },
    ]),
    BillModule,
    TodosModule,
    TaskModule,
    FundingModule,
  ],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
