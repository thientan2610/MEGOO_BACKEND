import { HttpStatus, Injectable } from '@nestjs/common';
import { ClientSocketReqDto, ClientSocketResDto } from '@nyp19vp-be/shared';
import { Model } from 'mongoose';
import { Socket, SocketDocument } from '../../schemas/socket.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class SocketCrudService {
  constructor(
    @InjectModel(Socket.name) private socketModel: Model<SocketDocument>,
  ) {}
  async create(
    clientSocketReqDto: ClientSocketReqDto,
  ): Promise<ClientSocketResDto> {
    const { user_id, client_id } = clientSocketReqDto;
    console.log(`Save client socket of user #${user_id}`);
    const isExists = await this.socketModel.findOne({ user_id: user_id });
    if (isExists) {
      return await this.socketModel
        .updateOne(
          { user_id: user_id },
          { client_id: client_id, status: true },
          { new: true },
        )
        .then(async (res) => {
          if (res) {
            const data = await this.socketModel.findOne({ user_id: user_id });
            return Promise.resolve({
              statusCode: HttpStatus.CREATED,
              message: `create user #${user_id} successfully`,
              socket: data,
            });
          }
        })
        .catch((error) => {
          return Promise.resolve({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: error.message,
            socket: null,
          });
        });
    } else {
      const newClient = new this.socketModel({
        user_id: user_id,
        client_id: client_id,
        status: true,
      });
      return await newClient
        .save()
        .then(async (res) => {
          if (res) {
            const data = await this.socketModel.findOne({ user_id: user_id });
            return Promise.resolve({
              statusCode: HttpStatus.CREATED,
              message: `create user #${user_id} successfully`,
              socket: data,
            });
          }
        })
        .catch((error) => {
          return Promise.resolve({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: error.message,
            socket: null,
          });
        });
    }
  }

  async remove(
    clientSocketReqDto: ClientSocketReqDto,
  ): Promise<ClientSocketResDto> {
    const { user_id, client_id } = clientSocketReqDto;
    console.log(`Remove client socket of user #${user_id}`);
    return await this.socketModel
      .updateOne({ user_id: user_id, client_id: client_id }, { status: false })
      .then(() => {
        return Promise.resolve({
          statusCode: HttpStatus.OK,
          message: `remove user #${user_id} successfully`,
          socket: null,
        });
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          socket: null,
        });
      });
  }

  async findByUserId(user_id: string): Promise<ClientSocketResDto> {
    console.log(`Get client socket from user #${user_id}`);
    return await this.socketModel
      .findOne({ user_id: user_id })
      .then((res) => {
        return Promise.resolve({
          statusCode: HttpStatus.OK,
          message: `get user #${user_id} successfully`,
          socket: res,
        });
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          socket: null,
        });
      });
  }
}
