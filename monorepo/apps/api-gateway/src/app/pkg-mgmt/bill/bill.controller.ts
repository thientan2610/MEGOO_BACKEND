import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Put,
  Patch,
} from '@nestjs/common';
import { BillService } from './bill.service';
import {
  BaseResDto,
  CreateBillReqDto,
  GetBillResDto,
  ParseObjectIdPipe,
  SendRequestReqDto,
  UpdateBillReqDto,
  UpdateBillSttReqDto,
} from '@nyp19vp-be/shared';
import { Types } from 'mongoose';
import { AccessJwtAuthGuard } from '../../auth/guards/jwt.guard';
import { SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME } from '../../constants/authentication';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { ATUser } from '../../decorators/at-user.decorator';

@ApiTags('Package Management/Bill')
@Controller('pkg-mgmt/bill')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @Post(':group_id')
  create(
    @ATUser() user: unknown,
    @Param('group_id') id: string,
    @Body() createBillReqDto: CreateBillReqDto,
  ): Promise<BaseResDto> {
    console.log(`Create billing of group #${id}`, createBillReqDto);
    createBillReqDto._id = id;
    createBillReqDto.createdBy = user?.['userInfo']?.['_id'];
    return this.billService.create(createBillReqDto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @ApiParam({ name: 'id', type: String })
  @Get(':id')
  findById(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
  ): Promise<GetBillResDto> {
    console.log(`Get billing #${id}`);
    return this.billService.findById(id);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @Put(':id')
  update(
    @ATUser() user: unknown,
    @Param('id') id: string,
    @Body() updateBillReqDto: UpdateBillReqDto,
  ): Promise<BaseResDto> {
    console.log(`Update billing #${id}`, updateBillReqDto);
    updateBillReqDto._id = id;
    updateBillReqDto.updatedBy = user?.['userInfo']?.['_id'];
    return this.billService.update(updateBillReqDto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @Put(':id/status/lender')
  updateStt(
    @ATUser() user: unknown,
    @Param('id') id: string,
    @Body() updateBillSttReqDto: UpdateBillSttReqDto,
  ): Promise<BaseResDto> {
    console.log(
      `Update billing status of group #${id} from lender`,
      updateBillSttReqDto,
    );
    updateBillSttReqDto._id = id;
    updateBillSttReqDto.updatedBy = user?.['userInfo']?.['_id'];
    return this.billService.updateStt(updateBillSttReqDto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @Post(':id/send_request')
  sendRequest(
    @ATUser() user: unknown,
    @Param('id') id: string,
    @Body() sendRequestReqDto: SendRequestReqDto,
  ): Promise<BaseResDto> {
    console.log(`send billing request to #${sendRequestReqDto.to_user}`);
    sendRequestReqDto.from_user = user?.['userInfo']?.['_id'];
    sendRequestReqDto._id = id;
    return this.billService.sendRequest(sendRequestReqDto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @ApiParam({ name: 'id', type: String })
  @Delete(':id')
  remove(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
  ): Promise<BaseResDto> {
    console.log(`Remove billing #${id}`);
    return this.billService.remove(id);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @ApiParam({ name: 'id', type: String })
  @Patch(':id')
  restore(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
  ): Promise<BaseResDto> {
    console.log(`Restore billing #${id}`);
    return this.billService.restore(id);
  }
}
