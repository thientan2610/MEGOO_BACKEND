import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import {
  AddTodosReqDto,
  BaseResDto,
  CreateTodosReqDto,
  GetTodosResDto,
  ParseObjectIdPipe,
  RmTodosReqDto,
  UpdateTodoReqDto,
  UpdateTodosReqDto,
  UpdateTodosStateReqDto,
} from '@nyp19vp-be/shared';
import { AccessJwtAuthGuard } from '../../auth/guards/jwt.guard';
import { SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME } from '../../constants/authentication';
import {
  ApiBearerAuth,
  ApiTags,
  ApiParam,
  ApiOperation,
} from '@nestjs/swagger';
import { ATUser } from '../../decorators/at-user.decorator';
import { Types } from 'mongoose';

@ApiTags('Package Management/Todos')
@Controller('pkg-mgmt/todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @Post(':group_id')
  create(
    @ATUser() user: unknown,
    @Param('group_id') id: string,
    @Body() createTodosReqDto: CreateTodosReqDto,
  ): Promise<BaseResDto> {
    console.log(`Create billing of group #${id}`, createTodosReqDto);
    createTodosReqDto._id = id;
    createTodosReqDto.createdBy = user?.['userInfo']?.['_id'];
    return this.todosService.create(createTodosReqDto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @ApiParam({ name: 'id', type: String })
  @Get(':id')
  findById(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
  ): Promise<GetTodosResDto> {
    console.log(`Get todos #${id}`);
    return this.todosService.findById(id);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @Put(':id')
  update(
    @ATUser() user: unknown,
    @Param('id') id: string,
    @Body() updateTodosReqDto: UpdateTodosReqDto,
  ): Promise<BaseResDto> {
    console.log(`Update todos #${id}`, updateTodosReqDto);
    updateTodosReqDto._id = id;
    updateTodosReqDto.updatedBy = user?.['userInfo']?.['_id'];
    return this.todosService.update(updateTodosReqDto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @Put(':id/state')
  updateState(
    @ATUser() user: unknown,
    @Param('id') id: string,
    @Body() updateTodosStateReqDto: UpdateTodosStateReqDto,
  ): Promise<BaseResDto> {
    console.log(`Update todos #${id}'s state`, updateTodosStateReqDto);
    updateTodosStateReqDto._id = id;
    updateTodosStateReqDto.createdBy = user?.['userInfo']?.['_id'];
    return this.todosService.updateState(updateTodosStateReqDto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @Put(':id/todo/:todo_id')
  updateTodo(
    @ATUser() user: unknown,
    @Param('id') id: string,
    @Param('todo_id') todo_id: string,
    @Body() updateTodoReqDto: UpdateTodoReqDto,
  ): Promise<BaseResDto> {
    console.log(
      `Update todo #${todo_id} of todo-list #${id}`,
      updateTodoReqDto,
    );
    updateTodoReqDto._id = id;
    updateTodoReqDto.todo_id = todo_id;
    updateTodoReqDto.updatedBy = user?.['userInfo']?.['_id'];
    return this.todosService.updateTodo(updateTodoReqDto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @ApiOperation({ summary: 'Remove todos from checklist' })
  @Delete(':id/todo')
  rmTodos(
    @ATUser() user: unknown,
    @Param('id') id: string,
    @Body() rmTodosReqDto: RmTodosReqDto,
  ): Promise<BaseResDto> {
    console.log(`Remove todos #${id}`, rmTodosReqDto);
    rmTodosReqDto._id = id;
    rmTodosReqDto.updatedBy = user?.['userInfo']?.['_id'];
    return this.todosService.rmTodos(rmTodosReqDto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @ApiOperation({ summary: 'Add todos to checklist' })
  @Post(':id/todo')
  addTodos(
    @ATUser() user: unknown,
    @Param('id') id: string,
    @Body() addTodosReqDto: AddTodosReqDto,
  ): Promise<BaseResDto> {
    console.log(`Add todos #${id}`, addTodosReqDto);
    addTodosReqDto._id = id;
    addTodosReqDto.updatedBy = user?.['userInfo']?.['_id'];
    return this.todosService.addTodos(addTodosReqDto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @ApiParam({ name: 'id', type: String })
  @Delete(':id')
  remove(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
  ): Promise<BaseResDto> {
    console.log(`Delete todos #${id}`);
    return this.todosService.remove(id);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @ApiParam({ name: 'id', type: String })
  @Patch(':id')
  restore(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
  ): Promise<BaseResDto> {
    console.log(`Restore todos #${id}`);
    return this.todosService.restore(id);
  }
}
