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
import { FundingService } from './funding.service';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME } from '../../constants/authentication';
import { AccessJwtAuthGuard } from '../../auth/guards/jwt.guard';
import { ATUser } from '../../decorators/at-user.decorator';
import {
  BaseResDto,
  CreateFundingReqDto,
  GetFundingResDto,
  ParseObjectIdPipe,
  SendReqDto,
  UpdateFundingSttReqDto,
} from '@nyp19vp-be/shared';
import { Types } from 'mongoose';

@ApiTags('Package Management/Funding')
@Controller('pkg-mgmt/funding')
export class FundingController {
  constructor(private readonly fundingService: FundingService) {}

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @Post(':group_id')
  create(
    @ATUser() user: unknown,
    @Param('group_id') id: string,
    @Body() createFundingReqDto: CreateFundingReqDto,
  ): Promise<BaseResDto> {
    console.log(`Create funding of group #${id}`, createFundingReqDto);
    createFundingReqDto._id = id;
    createFundingReqDto.createdBy = user?.['userInfo']?.['_id'];
    return this.fundingService.create(createFundingReqDto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @ApiParam({ name: 'id', type: String })
  @Get(':id')
  findById(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
  ): Promise<GetFundingResDto> {
    console.log(`Get funding #${id}`);
    return this.fundingService.findById(id);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @Put(':id')
  update(
    @ATUser() user: unknown,
    @Param('id') id: string,
    @Body() updateFundingReqDto: CreateFundingReqDto,
  ): Promise<BaseResDto> {
    console.log(`Update funding #${id}`, updateFundingReqDto);
    updateFundingReqDto._id = id;
    updateFundingReqDto.createdBy = user?.['userInfo']?.['_id'];
    return this.fundingService.update(updateFundingReqDto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @ApiParam({ name: 'id', type: String })
  @Delete(':id')
  remove(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
  ): Promise<BaseResDto> {
    console.log(`Remove funding #${id}`);
    return this.fundingService.remove(id);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @ApiParam({ name: 'id', type: String })
  @Patch(':id')
  restore(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
  ): Promise<BaseResDto> {
    console.log(`Restore funding #${id}`);
    return this.fundingService.restore(id);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @Post('send_request')
  sendRequest(
    @ATUser() user: unknown,
    @Body() sendReqDto: SendReqDto,
  ): Promise<BaseResDto> {
    console.log(`Send funding request to ${sendReqDto.to_user}`);
    sendReqDto.from_user = user?.['userInfo']?.['_id'];
    return this.fundingService.sendRequest(sendReqDto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH_ACCESS_TOKEN_NAME)
  @UseGuards(AccessJwtAuthGuard)
  @Put('stt/:fundHist_id')
  updateStt(
    @ATUser() user: unknown,
    @Param('fundHist_id') id: string,
    @Body() updateStt: UpdateFundingSttReqDto,
  ): Promise<BaseResDto> {
    console.log(`Update status of funding history`, id);
    updateStt._id = id;
    updateStt.updatedBy = user?.['userInfo']?.['_id'];
    return this.fundingService.updateStt(updateStt);
  }
}
