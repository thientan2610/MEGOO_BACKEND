import {
  CollectionDto,
  CollectionResponse,
} from '@forlagshuset/nestjs-mongoose-paginate';
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
  AddGrMbReqDto,
  RmGrMbReqDto,
  CreateGrReqDto,
  GetGrResDto,
  kafkaTopic,
  UpdateGrReqDto,
  UpdateGrPkgReqDto,
  GroupDto,
  BaseResDto,
  ValidateJoinGroupTokenResDto,
  GetGrsResDto,
  UpdateAvatarReqDto,
  ActivateGrPkgReqDto,
  PkgGrInvReqDto,
  UpdateChannelReqDto,
  PaginationParams,
  ProjectionParams,
} from '@nyp19vp-be/shared';
import { Types } from 'mongoose';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { SocketGateway } from '../../socket/socket.gateway';

@Injectable()
export class GroupService implements OnModuleInit {
  constructor(
    @Inject('PKG_MGMT_SERVICE') private readonly packageMgmtClient: ClientKafka,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientKafka,
    private readonly socketGateway: SocketGateway,
  ) {}
  onModuleInit() {
    const grTopics = Object.values(kafkaTopic.PKG_MGMT.GROUP);

    for (const topic of grTopics) {
      this.packageMgmtClient.subscribeToResponseOf(topic);
    }

    // subscribe to kafka topics "kafkaTopic.AUTH.GENERATE_JOIN_GR_TOKEN"
    this.authClient.subscribeToResponseOf(
      kafkaTopic.AUTH.GENERATE_JOIN_GR_TOKEN,
    );

    this.authClient.subscribeToResponseOf(
      kafkaTopic.AUTH.VALIDATE_JOIN_GR_TOKEN,
    );
  }
  async create(createGrReqDto: CreateGrReqDto): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient.send(
        kafkaTopic.PKG_MGMT.GROUP.CREATE,
        JSON.stringify(createGrReqDto),
      ),
    ).then((res) => {
      if (res.statusCode == HttpStatus.CREATED) return res;
      else throw new HttpException(res.message, res.statusCode);
    });
  }
  async find(
    collectionDto: CollectionDto,
  ): Promise<CollectionResponse<GroupDto>> {
    return await firstValueFrom(
      this.packageMgmtClient.send(kafkaTopic.PKG_MGMT.GROUP.GET, collectionDto),
    );
  }
  async findById(projectionParams: ProjectionParams): Promise<GetGrResDto> {
    return await firstValueFrom(
      this.packageMgmtClient.send(
        kafkaTopic.PKG_MGMT.GROUP.GET_BY_ID,
        JSON.stringify(projectionParams),
      ),
    ).then((res) => {
      if (res.statusCode == HttpStatus.OK) return res;
      else throw new HttpException(res.message, res.statusCode);
    });
  }
  async update(updatePkgReqDto: UpdateGrReqDto): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient.send(
        kafkaTopic.PKG_MGMT.GROUP.UPDATE,
        JSON.stringify(updatePkgReqDto),
      ),
    ).then((res) => {
      if (res.statusCode == HttpStatus.OK) return res;
      else throw new HttpException(res.message, res.statusCode);
    });
  }
  async remove(id: Types.ObjectId): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient.send(kafkaTopic.PKG_MGMT.GROUP.DELETE, id),
    ).then((res) => {
      if (res.statusCode == HttpStatus.OK) return res;
      else throw new HttpException(res.message, res.statusCode);
    });
  }
  async restore(id: Types.ObjectId): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient.send(kafkaTopic.PKG_MGMT.GROUP.RESTORE, id),
    ).then((res) => {
      if (res.statusCode == HttpStatus.OK) return res;
      else throw new HttpException(res.message, res.statusCode);
    });
  }
  async addMemb(updateGrMbReqDto: AddGrMbReqDto): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient.send(
        kafkaTopic.PKG_MGMT.GROUP.ADD_MEMB,
        JSON.stringify(updateGrMbReqDto),
      ),
    ).then((res) => {
      if (res.statusCode == HttpStatus.OK) return res;
      else throw new HttpException(res.message, res.statusCode);
    });
  }
  async rmMemb(updateGrMbReqDto: RmGrMbReqDto): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient.send(
        kafkaTopic.PKG_MGMT.GROUP.DEL_MEMB,
        JSON.stringify(updateGrMbReqDto),
      ),
    ).then((res) => {
      if (res.statusCode == HttpStatus.OK) return res;
      else throw new HttpException(res.message, res.statusCode);
    });
  }
  async rmPkg(updateGrPkgReqDto: UpdateGrPkgReqDto): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient.send(
        kafkaTopic.PKG_MGMT.GROUP.DEL_PKG,
        JSON.stringify(updateGrPkgReqDto),
      ),
    ).then((res) => {
      if (res.statusCode == HttpStatus.OK) return res;
      else throw new HttpException(res.message, res.statusCode);
    });
  }
  async addPkg(updateGrPkgReqDto: UpdateGrPkgReqDto): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient.send(
        kafkaTopic.PKG_MGMT.GROUP.ADD_PKG,
        JSON.stringify(updateGrPkgReqDto),
      ),
    ).then((res) => {
      if (res.statusCode == HttpStatus.OK) return res;
      else throw new HttpException(res.message, res.statusCode);
    });
  }

  async invToJoinGr(reqDto: PkgGrInvReqDto): Promise<BaseResDto> {
    console.log('reqDto', reqDto);

    const resDto = await firstValueFrom(
      this.authClient.send(
        kafkaTopic.AUTH.GENERATE_JOIN_GR_TOKEN,
        JSON.stringify(reqDto),
      ),
    );

    return resDto;
  }

  async join(userInfoId: string, token: string): Promise<BaseResDto> {
    const decodeRes: ValidateJoinGroupTokenResDto = await firstValueFrom(
      this.authClient.send(
        kafkaTopic.AUTH.VALIDATE_JOIN_GR_TOKEN,
        JSON.stringify({ token }),
      ),
    );

    console.log('decodeRes', decodeRes);
    decodeRes.user = userInfoId;

    const payload: AddGrMbReqDto = {
      _id: decodeRes['grId'] || null,
      user: userInfoId || null,
      addedBy: decodeRes['addedBy'] || null,
    };

    return await firstValueFrom(
      this.packageMgmtClient.send(
        kafkaTopic.PKG_MGMT.GROUP.ADD_MEMB,
        JSON.stringify(payload),
      ),
    ).then(async (res) => {
      if (res.statusCode == HttpStatus.OK) {
        const projectionParams: ProjectionParams = {
          _id: decodeRes['grId'],
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
            'joinGr',
            member.user._id,
            payload,
          );
        });
        await Promise.all(noti);
        return res;
      } else throw new HttpException(res.message, res.statusCode);
    });
  }
  async findByUser(paginationParams: PaginationParams): Promise<GetGrsResDto> {
    return await firstValueFrom(
      this.packageMgmtClient.send(
        kafkaTopic.PKG_MGMT.GROUP.GET_BY_USER,
        JSON.stringify(paginationParams),
      ),
    ).then((res) => {
      if (res.statusCode == HttpStatus.OK) return res;
      else throw new HttpException(res.message, res.statusCode);
    });
  }
  async findWithDeleted(
    paginationParams: PaginationParams,
  ): Promise<GetGrsResDto> {
    return await firstValueFrom(
      this.packageMgmtClient.send(
        kafkaTopic.PKG_MGMT.GROUP.GET_DELETED,
        JSON.stringify(paginationParams),
      ),
    ).then((res) => {
      if (res.statusCode == HttpStatus.OK) return res;
      else throw new HttpException(res.message, res.statusCode);
    });
  }
  async updateAvatar(
    updateAvatarReqDto: UpdateAvatarReqDto,
  ): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(
          kafkaTopic.PKG_MGMT.GROUP.UPDATE_AVATAR,
          JSON.stringify(updateAvatarReqDto),
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
  async activatePkg(
    activateGrPkgReqDto: ActivateGrPkgReqDto,
  ): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(
          kafkaTopic.PKG_MGMT.GROUP.ACTIVATE_PKG,
          JSON.stringify(activateGrPkgReqDto),
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
  async updateChannel(
    updateChannelReqDto: UpdateChannelReqDto,
  ): Promise<BaseResDto> {
    return await firstValueFrom(
      this.packageMgmtClient
        .send(
          kafkaTopic.PKG_MGMT.GROUP.UPDATE_CHANNEL,
          JSON.stringify(updateChannelReqDto),
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
