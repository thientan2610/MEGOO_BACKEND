import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AddTodosReqDto,
  BaseResDto,
  CreateTodosReqDto,
  GetTodosResDto,
  RmTodosReqDto,
  UpdateTodoReqDto,
  UpdateTodosReqDto,
  UpdateTodosStateReqDto,
  kafkaTopic,
} from '@nyp19vp-be/shared';
import { Types } from 'mongoose';
import { TodosService } from './todos.service';

@Controller()
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.TODOS.CREATE)
  create(@Payload() createTodosReqDto: CreateTodosReqDto): Promise<BaseResDto> {
    return this.todosService.create(createTodosReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.TODOS.GET_BY_ID)
  findById(@Payload() id: Types.ObjectId): Promise<GetTodosResDto> {
    return this.todosService.findById(id);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.TODOS.UPDATE)
  update(@Payload() updateTodosReqDto: UpdateTodosReqDto): Promise<BaseResDto> {
    return this.todosService.update(updateTodosReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.TODOS.UPDATE_STATE)
  updateState(
    @Payload() updateTodosStateReqDto: UpdateTodosStateReqDto,
  ): Promise<BaseResDto> {
    return this.todosService.updateState(updateTodosStateReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.TODOS.UPDATE_TODO)
  updateTodo(
    @Payload() updateTodoReqDto: UpdateTodoReqDto,
  ): Promise<BaseResDto> {
    return this.todosService.updateTodo(updateTodoReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.TODOS.DEL_TODO)
  rmTodos(@Payload() rmTodosReqDto: RmTodosReqDto): Promise<BaseResDto> {
    return this.todosService.rmTodos(rmTodosReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.TODOS.ADD_TODO)
  addTodos(@Payload() addTodosReqDto: AddTodosReqDto): Promise<BaseResDto> {
    return this.todosService.addTodos(addTodosReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.TODOS.DELETE)
  remove(@Payload() id: Types.ObjectId): Promise<BaseResDto> {
    return this.todosService.remove(id);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.TODOS.RESTORE)
  restore(@Payload() id: Types.ObjectId): Promise<BaseResDto> {
    return this.todosService.restore(id);
  }
}
