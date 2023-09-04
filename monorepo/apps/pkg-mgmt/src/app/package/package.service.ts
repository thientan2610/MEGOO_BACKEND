import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  BaseResDto,
  CreatePkgReqDto,
  GetPkgResDto,
  IdDto,
  PackageDto,
  UpdatePkgReqDto,
} from '@nyp19vp-be/shared';
import { Types } from 'mongoose';
import { Package, PackageDocument } from '../../schemas/package.schema';
import {
  CollectionDto,
  CollectionResponse,
  DocumentCollector,
} from '@forlagshuset/nestjs-mongoose-paginate';
import { SoftDeleteModel } from 'mongoose-delete';

@Injectable()
export class PackageService {
  constructor(
    @InjectModel(Package.name)
    private pkgModel: SoftDeleteModel<PackageDocument>,
  ) {}
  async create(createPkgReqDto: CreatePkgReqDto): Promise<BaseResDto> {
    console.log('pkg-mgmt-svc#create-package: ', createPkgReqDto);
    const newPkg = new this.pkgModel({ ...createPkgReqDto });
    return await newPkg
      .save()
      .then(() => {
        return Promise.resolve({
          statusCode: HttpStatus.CREATED,
          message: `create user #${createPkgReqDto.name} successfully`,
        });
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
        });
      });
  }

  async find(
    collectionDto: CollectionDto,
  ): Promise<CollectionResponse<PackageDto>> {
    console.log('pkg-mgmt-svc#get-all-packages');
    const collector = new DocumentCollector<PackageDocument>(this.pkgModel);
    return await collector
      .find(collectionDto)
      .then((res) => {
        return Promise.resolve({
          data: res.data,
          pagination: res.pagination,
        });
      })
      .catch((err) => {
        throw err;
      });
  }
  async findWithDeleted(req): Promise<PackageDto[]> {
    console.log('pkg-mgmt-svc#get-all-packages with deleted');
    return await this.pkgModel.findWithDeleted().exec();
  }

  async findById(id: Types.ObjectId): Promise<GetPkgResDto> {
    console.log(`pkg-mgmt-svc#get-package #${id}`);
    return await this.pkgModel
      .findById({ _id: id })
      .then((res) => {
        if (res)
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `get package #${id} successfully`,
            package: res,
          });
        else
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No package #${id} found`,
            error: 'NOT FOUND',
            package: res,
          });
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          package: null,
        });
      });
  }

  async update(updatePkgReqDto: UpdatePkgReqDto): Promise<BaseResDto> {
    const { _id } = updatePkgReqDto;
    console.log(`pkg-mgmt-svc#update-package #${_id}`);
    return await this.pkgModel
      .updateOne({ _id: _id }, { ...updatePkgReqDto })
      .then(async (res) => {
        if (res.matchedCount && res.modifiedCount) {
          const data = await this.pkgModel.findById(_id);
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `get package #${_id} successfully`,
            data: data,
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No package #${_id} found`,
            error: 'NOT FOUND',
          });
        }
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
        });
      });
  }

  async remove(id: Types.ObjectId): Promise<BaseResDto> {
    console.log(`pkg-mgmt-svc#delete-package #${id}`);
    return await this.pkgModel
      .deleteById(id)
      .then(async (res) => {
        if (res) {
          const data = await this.pkgModel.findById(id);
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `delete package #${id} successfully`,
            data: data,
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No package #${id} found`,
            error: 'NOT FOUND',
          });
        }
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
        });
      });
  }

  async restore(id: Types.ObjectId): Promise<BaseResDto> {
    console.log(`pkg-mgmt-svc#restore-deleted-package #${id}`);
    return await this.pkgModel
      .restore({ _id: id })
      .then(async (res) => {
        if (res) {
          const data = await this.pkgModel.findById(id);
          return Promise.resolve({
            statusCode: HttpStatus.OK,
            message: `Restore deleted package #${id} successfully`,
            data: data,
          });
        } else {
          return Promise.resolve({
            statusCode: HttpStatus.NOT_FOUND,
            message: `No package #${id} found`,
            error: 'NOT FOUND',
          });
        }
      })
      .catch((error) => {
        return Promise.resolve({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
        });
      });
  }

  async findMany(list_id: IdDto[]): Promise<PackageDto[]> {
    const res = await this.pkgModel.find({ _id: { $in: list_id } }).exec();
    return res;
  }
}
