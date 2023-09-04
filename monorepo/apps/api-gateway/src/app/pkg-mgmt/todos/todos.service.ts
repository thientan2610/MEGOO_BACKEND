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
  AddTodosReqDto,
  BaseResDto,
  CreateTodosReqDto,
  GetGrByExReqDto,
  GetTodosResDto,
  ProjectionParams,
  RmTodosReqDto,
  State,
  UpdateTodoReqDto,
  UpdateTodosReqDto,
  UpdateTodosStateReqDto,
  kafkaTopic,
} from '@nyp19vp-be/shared';
import { Types } from 'mongoose';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { SocketGateway } from '../../socket/socket.gateway';

@Injectable()
export class TodosService implements OnModuleInit {
  constructor(
    @Inject('PKG_MGMT_SERVICE') private readonly packageMgmtClient: ClientKafka,
    private readonly socketGateway: SocketGateway,
  ) {}
  onModuleInit() {
    const todosTopics = Object.values(kafkaTopic.PKG_MGMT.EXTENSION.TODOS);

    for (const topic of todosTopics) {
      this.packageMgmtClient.subscribeToResponseOf(topic);
    }

    this.packageMgmtClient.subscribeToResponseOf(
      kafkaTopic.PKG_MGMT.GROUP.GET_BY_EXTENSION,
    );
    this.packageMgmtClient.subscribeToResponseOf(
      kafkaTopic.PKG_MGMT.GROUP.GET_BY_ID,
    );
  }
  async create(createTodosReqDto: CreateTodosReqDto): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(
          kafkaTopic.PKG_MGMT.EXTENSION.TODOS.CREATE,
          JSON.stringify(createTodosReqDto),
        )
        .pipe(
          timeout(10000),
          catchError(() => {
            throw new RequestTimeoutException();
          }),
        ),
    ).then(async (res) => {
      if (res.statusCode == HttpStatus.CREATED) {
        if (createTodosReqDto.state == State[1]) {
          const projectionParams: ProjectionParams = {
            _id: createTodosReqDto._id,
            proj: { members: true },
          };
          const members = await firstValueFrom(
            this.packageMgmtClient.send(
              kafkaTopic.PKG_MGMT.GROUP.GET_BY_ID,
              projectionParams,
            ),
          );
          const noti = members.group.members.map(async (member) => {
            await this.socketGateway.handleEvent(
              'createdTodos',
              member.user._id,
              res.data,
            );
          });
          await Promise.all(noti);
        }
        return res;
      } else {
        throw new HttpException(res.message, res.statusCode);
      }
    });
  }
  async findById(id: Types.ObjectId): Promise<GetTodosResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(kafkaTopic.PKG_MGMT.EXTENSION.TODOS.GET_BY_ID, id)
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
  async update(updateTodosReqDto: UpdateTodosReqDto): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(
          kafkaTopic.PKG_MGMT.EXTENSION.TODOS.UPDATE,
          JSON.stringify(updateTodosReqDto),
        )
        .pipe(
          timeout(10000),
          catchError(() => {
            throw new RequestTimeoutException();
          }),
        ),
    ).then(async (res) => {
      if (res.statusCode == HttpStatus.OK) {
        if (res.data.state == State[1]) {
          const getGrByExReqDto: GetGrByExReqDto = {
            _id: res.data._id,
            extension: 'todos',
          };
          const members = await firstValueFrom(
            this.packageMgmtClient.send(
              kafkaTopic.PKG_MGMT.GROUP.GET_BY_EXTENSION,
              getGrByExReqDto,
            ),
          );
          const noti = members.group.members.map(async (member) => {
            await this.socketGateway.handleEvent(
              'updatedTodos',
              member.user._id,
              res.data,
            );
          });
          await Promise.all(noti);
        }
        return res;
      } else {
        throw new HttpException(res.message, res.statusCode);
      }
    });
  }
  async updateState(
    updateTodosStateReqDto: UpdateTodosStateReqDto,
  ): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(
          kafkaTopic.PKG_MGMT.EXTENSION.TODOS.UPDATE_STATE,
          JSON.stringify(updateTodosStateReqDto),
        )
        .pipe(
          timeout(10000),
          catchError(() => {
            throw new RequestTimeoutException();
          }),
        ),
    ).then(async (res) => {
      if (res.statusCode == HttpStatus.OK) {
        if (res.data.state == State[1]) {
          const getGrByExReqDto: GetGrByExReqDto = {
            _id: res.data._id,
            extension: 'todos',
          };
          const members = await firstValueFrom(
            this.packageMgmtClient.send(
              kafkaTopic.PKG_MGMT.GROUP.GET_BY_EXTENSION,
              getGrByExReqDto,
            ),
          );
          const noti = members.group.members.map(async (member) => {
            await this.socketGateway.handleEvent(
              'updatedTodos',
              member.user._id,
              res.data,
            );
          });
          await Promise.all(noti);
        }
        return res;
      } else {
        throw new HttpException(res.message, res.statusCode);
      }
    });
  }
  async updateTodo(updateTodoReqDto: UpdateTodoReqDto): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(
          kafkaTopic.PKG_MGMT.EXTENSION.TODOS.UPDATE_TODO,
          JSON.stringify(updateTodoReqDto),
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
        .send(kafkaTopic.PKG_MGMT.EXTENSION.TODOS.DELETE, id)
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
  async restore(id: Types.ObjectId): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(kafkaTopic.PKG_MGMT.EXTENSION.TODOS.RESTORE, id)
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
  async rmTodos(rmTodosReqDto: RmTodosReqDto): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(
          kafkaTopic.PKG_MGMT.EXTENSION.TODOS.DEL_TODO,
          JSON.stringify(rmTodosReqDto),
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
  async addTodos(addTodosReqDto: AddTodosReqDto): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(
          kafkaTopic.PKG_MGMT.EXTENSION.TODOS.ADD_TODO,
          JSON.stringify(addTodosReqDto),
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
}
