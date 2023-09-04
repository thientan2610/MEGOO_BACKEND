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
import { TaskService } from './task.service';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME } from '../../constants/authentication';
import { AccessJwtAuthGuard } from '../../auth/guards/jwt.guard';
import { ATUser } from '../../decorators/at-user.decorator';
import {
  BaseResDto,
  CreateTaskReqDto,
  GetTaskResDto,
  ParseObjectIdPipe,
  UpdateTaskReqDto,
  UpdateTaskStateReqDto,
} from '@nyp19vp-be/shared';
import { Types } from 'mongoose';

@ApiTags('Package Management/Task')
@Controller('pkg-mgmt/task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @Post(':group_id')
  create(
    @ATUser() user: unknown,
    @Param('group_id') id: string,
    @Body() createTaskReqDto: CreateTaskReqDto,
  ): Promise<BaseResDto> {
    console.log(`Create task of group #${id}`, createTaskReqDto);
    createTaskReqDto._id = id;
    createTaskReqDto.createdBy = user?.['userInfo']?.['_id'];
    return this.taskService.create(createTaskReqDto);
  }

  @ApiParam({ name: 'id', type: String })
  @Get(':id')
  findById(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
  ): Promise<GetTaskResDto> {
    console.log(`Get task #${id}`);
    return this.taskService.findById(id);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @Put(':id')
  update(
    @ATUser() user: unknown,
    @Param('id') id: string,
    @Body() updateTaskReqDto: UpdateTaskReqDto,
  ): Promise<BaseResDto> {
    console.log(`Update task #${id}`, updateTaskReqDto);
    updateTaskReqDto._id = id;
    updateTaskReqDto.updatedBy = user?.['userInfo']?.['_id'];
    return this.taskService.update(updateTaskReqDto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @Put(':id/state')
  updateState(
    @ATUser() user: unknown,
    @Param('id') id: string,
    @Body() updateTaskStateReqDto: UpdateTaskStateReqDto,
  ): Promise<BaseResDto> {
    console.log(`Update task #${id}'s state`, updateTaskStateReqDto);
    updateTaskStateReqDto._id = id;
    updateTaskStateReqDto.updatedBy = user?.['userInfo']?.['_id'];
    return this.taskService.updateState(updateTaskStateReqDto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @ApiParam({ name: 'id', type: String })
  @Delete(':id')
  remove(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
  ): Promise<BaseResDto> {
    console.log(`Delete tasks #${id}`);
    return this.taskService.remove(id);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @ApiParam({ name: 'id', type: String })
  @Patch(':id')
  restore(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
  ): Promise<BaseResDto> {
    console.log(`Restore tasks #${id}`);
    return this.taskService.restore(id);
  }
}
