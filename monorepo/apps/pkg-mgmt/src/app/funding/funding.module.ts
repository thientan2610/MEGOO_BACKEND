import { Module } from '@nestjs/common';
import { FundingService } from './funding.service';
import { FundingController } from './funding.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from '../../schemas/group.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  FundHist,
  FundHistSchema,
  Funding,
  FundingSchema,
} from '../../schemas/funding.schema';
import { BillModule } from '../bill/bill.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Group.name, schema: GroupSchema },
      { name: Funding.name, schema: FundingSchema },
      { name: FundHist.name, schema: FundHistSchema },
    ]),
    ClientsModule.register([
      {
        name: 'USERS_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'users' + 'fund-crud' + 'users',
            brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
          },
          consumer: {
            groupId: 'users-consumer' + 'fund-crud' + 'users',
          },
        },
      },
    ]),
    BillModule,
  ],
  controllers: [FundingController],
  providers: [FundingService],
  exports: [FundingService],
})
export class FundingModule {}
