import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TaskService } from './task.service';
import {
  BaseResDto,
  CreateTaskReqDto,
  UpdateTaskReqDto,
  UpdateTaskStateReqDto,
  kafkaTopic,
} from '@nyp19vp-be/shared';
import { Types } from 'mongoose';

@Controller()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.TASK.CREATE)
  create(
    @Payload() createTaskReqDtoDto: CreateTaskReqDto,
  ): Promise<BaseResDto> {
    return this.taskService.create(createTaskReqDtoDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.TASK.GET_BY_ID)
  findById(@Payload() id: Types.ObjectId): Promise<BaseResDto> {
    return this.taskService.findById(id);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.TASK.UPDATE)
  update(@Payload() updateTaskReqDto: UpdateTaskReqDto): Promise<BaseResDto> {
    return this.taskService.update(updateTaskReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.TASK.UPDATE_STATE)
  updateState(
    @Payload() updateTaskStateReqDto: UpdateTaskStateReqDto,
  ): Promise<BaseResDto> {
    return this.taskService.updateState(updateTaskStateReqDto);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.TASK.UPDATE_OCCURRENCE)
  updateOccurrence(@Payload() id: Types.ObjectId): Promise<BaseResDto> {
    return this.taskService.updateOccurrence(id);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.TASK.DELETE)
  remove(@Payload() id: Types.ObjectId): Promise<BaseResDto> {
    return this.taskService.remove(id);
  }

  @MessagePattern(kafkaTopic.PKG_MGMT.EXTENSION.TASK.RESTORE)
  restore(@Payload() id: Types.ObjectId): Promise<BaseResDto> {
    return this.taskService.restore(id);
  }
}
