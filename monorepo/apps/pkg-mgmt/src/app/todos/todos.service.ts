import {
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  AddTodosReqDto,
  BaseResDto,
  CreateTodosReqDto,
  GetGrDto_Todos,
  GetTodosResDto,
  RmTodosReqDto,
  State,
  UpdateTodoReqDto,
  UpdateTodosReqDto,
  UpdateTodosStateReqDto,
  kafkaTopic,
} from '@nyp19vp-be/shared';
import { Group, GroupDocument } from '../../schemas/group.schema';
import { SoftDeleteModel } from 'mongoose-delete';
import {
  Todo,
  TodoDocument,
  TodoList,
  TodoListDocument,
} from '../../schemas/todos.schema';
import mongoose, { Types } from 'mongoose';
import { firstValueFrom, timeout } from 'rxjs';
import { ClientKafka } from '@nestjs/microservices';
import { BillService } from '../bill/bill.service';

@Injectable()
export class TodosService implements OnModuleInit {
  constructor(
    private readonly billService: BillService,
    @InjectModel(Group.name) private grModel: SoftDeleteModel<GroupDocument>,
    @InjectModel(TodoList.name)
    private todosModel: SoftDeleteModel<TodoListDocument>,
    @InjectModel(Todo.name) private todoModel: SoftDeleteModel<TodoDocument>,
    @Inject('USERS_SERVICE') private readonly usersClient: ClientKafka,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}
  onModuleInit() {
    this.usersClient.subscribeToResponseOf(kafkaTopic.USERS.GET_MANY);
  }
  async create(createTodosReqDto: CreateTodosReqDto): Promise<BaseResDto> {
    const { _id, todos, createdBy } = createTodosReqDto;
    const isAuthor = await this.billService.isGrU(_id, [createdBy]);
    if (!isAuthor) {
      return Promise.resolve({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: 'UNAUTHORIZED',
        message: `MUST be group's member to create bill`,
      });
    } else {
      const createdTodos = todos.map(async (todo) => {
        const newTodo = new this.todoModel({
          todo: todo.todo,
          assignee: todo.assignee,
          description: todo.description,
          isCompleted: todo.isCompleted,
        });
        const nw = await newTodo.save();
        return nw._id;
      });
      const newTodos = new this.todosModel({
        summary: createTodosReqDto.summary,
        todos: await Promise.all(createdTodos),
        state: createTodosReqDto.state,
        createdBy: createdBy,
      });
      return await newTodos.save().then(async (saveTodos) => {
        return await this.grModel
          .findByIdAndUpdate({ _id: _id }, { $push: { todos: saveTodos } })
          .then((res) => {
            return {
              statusCode: res ? HttpStatus.CREATED : HttpStatus.NOT_FOUND,
              message: res
                ? `Created todos of group ${_id} successfully`
                : `Group #${_id} not found`,
              data: saveTodos,
            };
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
  async findById(id: Types.ObjectId): Promise<GetTodosResDto> {
    console.log(`Get todos #${id}`);
    return await this.todosModel
      .findById(id)
      .populate({ path: 'todos', model: 'Todo' })
      .then(async (res) => {
        return {
          statusCode: res ? HttpStatus.OK : HttpStatus.NOT_FOUND,
          message: res
            ? `Get todos #${id} successfully`
            : `Todos #${id} not found`,
          todos: res
            ? await this.mapTodosModelToGetGrDto_Todos(res.toObject())
            : null,
        };
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          error: 'INTERNAL SERVER ERROR',
          todos: null,
        });
      });
  }
  async mapTodosModelToGetGrDto_Todos(
    model,
    owner?: string,
  ): Promise<GetGrDto_Todos> {
    const { updatedBy, createdBy } = model;
    if (owner != undefined && model.state == State[0] && createdBy != owner) {
      return undefined;
    } else {
      let list_others = updatedBy ? [createdBy, updatedBy] : [createdBy];
      for (const item of model.todos) {
        if (item.assignee) {
          list_others.push(item.assignee);
        }
      }
      list_others = list_others.filter(
        (value, index, array) => array.indexOf(value) === index,
      );

      const list_user = await firstValueFrom(
        this.usersClient
          .send(kafkaTopic.USERS.GET_MANY, list_others)
          .pipe(timeout(10000)),
      );
      let newState = [...model.todos];
      newState = newState.map((data) => {
        const idx = list_user.find((elem) => elem._id == data.assignee);
        if (idx) {
          const updatedData = {
            ...data,
            assignee: idx,
          };
          return updatedData;
        }
        return data;
      });
      const result: GetGrDto_Todos = {
        _id: model._id,
        summary: model.summary,
        todos: newState,
        state: model.state,
        createdBy: list_user.find((elem) => elem._id == createdBy),
        updatedBy: updatedBy
          ? list_user.find((elem) => elem._id == updatedBy)
          : undefined,
      };
      return result;
    }
  }
  async update(updateTodosReqDto: UpdateTodosReqDto): Promise<BaseResDto> {
    const { _id } = updateTodosReqDto;
    console.log(`Update todos #${_id}`);
    return await this.todosModel
      .findByIdAndUpdate(
        { _id: _id },
        {
          $set: {
            summary: updateTodosReqDto.summary,
            updatedBy: updateTodosReqDto.updatedBy,
          },
        },
      )
      .then(async (res) => {
        return {
          statusCode: res ? HttpStatus.OK : HttpStatus.NOT_FOUND,
          message: res
            ? `Update todos #${_id} successfully`
            : `Todos #${_id} not found`,
          data: res
            ? await this.todosModel
                .findById(_id)
                .populate({ path: 'todos', model: 'Todo' })
            : null,
        };
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
        });
      });
  }
  async updateState(
    updateTodosStateReqDto: UpdateTodosStateReqDto,
  ): Promise<BaseResDto> {
    const { _id } = updateTodosStateReqDto;
    console.log(`Update todos #${_id}'s state`);
    const todosList = await this.todosModel.findById(_id);
    if (!todosList) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Todos #${_id} not found`,
      };
    }
    if (todosList.createdBy == updateTodosStateReqDto.createdBy) {
      return await this.todosModel
        .updateOne(
          { _id: _id },
          {
            $set: {
              state: updateTodosStateReqDto.state,
              updatedBy: updateTodosStateReqDto.createdBy,
            },
          },
        )
        .then(async () => {
          return {
            statusCode: HttpStatus.OK,
            message: `Update todos #${_id}'s state successfully`,
            data: await this.todosModel
              .findById(_id)
              .populate({ path: 'todos', model: 'Todo' }),
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
        error: 'UNAUTHORIZED',
      };
    }
  }
  async updateTodo(updateTodoReqDto: UpdateTodoReqDto): Promise<BaseResDto> {
    const { _id, todo_id } = updateTodoReqDto;
    console.log(`Update todo #${todo_id} of todo-list #${_id}`);
    const session = await this.connection.startSession();
    session.startTransaction();
    let result: BaseResDto;
    try {
      const todo_list = await this.todosModel.findOne({
        _id: _id,
        todos: { $in: [todo_id] },
      });
      if (!todo_list) {
        throw new NotFoundException(`Todo-list #${_id} not found`);
      }
      await this.todosModel
        .updateOne(
          { _id: _id },
          { $set: { updatedBy: updateTodoReqDto.updatedBy } },
        )
        .session(session);
      const todo = await this.todoModel
        .findByIdAndUpdate(
          { _id: todo_id },
          {
            $set: {
              todo: updateTodoReqDto.todo,
              assignee: updateTodoReqDto.assignee,
              description: updateTodoReqDto.description
                ? updateTodoReqDto.description
                : null,
              isCompleted: updateTodoReqDto.isCompleted,
            },
          },
        )
        .session(session);
      if (!todo) {
        throw new NotFoundException(`Todo #${todo_id} not found`);
      }
      await session.commitTransaction();
      result = {
        statusCode: HttpStatus.OK,
        message: `Update todo #${todo_id} of todo-list #${_id} successfully`,
        data: await this.todosModel
          .findById(_id)
          .populate({ path: 'todos', model: 'Todo' }),
      };
    } catch (error) {
      await session.abortTransaction();
      result = {
        statusCode: error.status,
        message: error.message,
      };
    } finally {
      session.endSession();
    }
    return result;
  }
  async addTodos(addTodosReqDto: AddTodosReqDto): Promise<BaseResDto> {
    const { _id, todos } = addTodosReqDto;
    console.log(`Add todos to list #${_id}`, todos);
    const newTodos = todos.map((ele) => {
      const newTodo = new this.todoModel({
        todo: ele.todo,
        description: ele.description,
        isCompleted: ele.isCompleted,
      });
      return newTodo;
    });
    return await this.todoModel.insertMany(newTodos).then(async (result) => {
      const list_id = result.map((ele) => {
        return ele._id;
      });
      return await this.todosModel
        .findByIdAndUpdate(
          { _id: _id },
          {
            $push: { todos: { $each: list_id } },
            $set: { updatedBy: addTodosReqDto.updatedBy },
          },
        )
        .then(async (res) => {
          return {
            statusCode: res ? HttpStatus.OK : HttpStatus.NOT_FOUND,
            message: res
              ? `Added todos to list ${_id} successfully`
              : `Todos list #${_id} not found`,
            data: res
              ? await this.todosModel
                  .findById(_id)
                  .populate({ path: 'todos', model: 'Todo' })
              : null,
          };
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
  async rmTodos(rmTodosReqDto: RmTodosReqDto): Promise<BaseResDto> {
    const { _id, todos } = rmTodosReqDto;
    console.log(`Remove todos to list #${_id}`, todos);
    const session = await this.connection.startSession();
    session.startTransaction();
    let result: BaseResDto;
    try {
      const todoList = await this.todosModel.findById(_id);
      if (!todoList) {
        throw new NotFoundException(`Todo-list #${_id} not found`);
      }
      todoList.todos = todoList.todos.filter((elem) => {
        if (todos.some((item) => item._id == elem.toString())) {
          return false;
        } else {
          return true;
        }
      });
      await this.todosModel
        .updateOne(
          { _id: _id },
          {
            $set: { todos: todoList.todos, updatedBy: rmTodosReqDto.updatedBy },
          },
        )
        .session(session);
      const res = await this.todoModel
        .deleteMany({ _id: { $in: todos } })
        .session(session);
      if (res.deletedCount == 0) {
        throw new NotFoundException();
      }

      await session.commitTransaction();
      result = {
        statusCode: HttpStatus.OK,
        message: `Remove todos #${todos} of todo-list #${_id} successfully`,
        data: await this.todosModel
          .findById(_id)
          .populate({ path: 'todos', model: 'Todo' }),
      };
    } catch (error) {
      await session.abortTransaction();
      result = {
        statusCode: error.status,
        message: error.message,
      };
    } finally {
      session.endSession();
    }
    return result;
  }
  async remove(id: Types.ObjectId): Promise<BaseResDto> {
    console.log(`Remove todos #${id}`);
    return await this.todosModel
      .deleteById(id)
      .then((res) => {
        return Promise.resolve({
          statusCode: HttpStatus.OK,
          message: `Remove todos ${id} successfully`,
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
    console.log(`Restore todos #${id}`);
    return await this.todosModel
      .restore({ _id: id })
      .then((res) => {
        return Promise.resolve({
          statusCode: HttpStatus.OK,
          message: `Restore todos ${id} successfully`,
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
