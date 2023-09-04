import { Module } from '@nestjs/common';
import { SocketCrudService } from './socket-crud.service';
import { SocketCrudController } from './socket-crud.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Socket, SocketSchema } from '../../schemas/socket.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Socket.name, schema: SocketSchema }]),
  ],
  controllers: [SocketCrudController],
  providers: [SocketCrudService],
})
export class SocketCrudModule {}
