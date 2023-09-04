import { Express } from 'express';
import { HttpStatus, Injectable } from '@nestjs/common';
import { UploadedFile } from '@nestjs/common';
import { CloudinaryService } from 'nestjs-cloudinary';
import { BaseResDto } from 'libs/shared/src/lib/dto/base.dto';
import { UploadApiOptions } from 'cloudinary';
@Injectable()
export class FileService {
  private static uploadOptions: UploadApiOptions = {
    folder: 'avatars/',
  };

  constructor(private readonly cloudinaryService: CloudinaryService) {}
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    users: string = null,
  ): Promise<BaseResDto> {
    try {
      const res = await this.cloudinaryService.uploadFile(file, {
        ...FileService.uploadOptions,
        folder: users
          ? `${FileService.uploadOptions.folder}${users}/`
          : FileService.uploadOptions.folder,
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Upload file successfully',
        data: res,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Upload file failed',
        data: error,
      };
    }
  }

  async uploadFileAndGetUrl(
    @UploadedFile() file: Express.Multer.File,
    users: string = null,
  ) {
    try {
      const res = await this.cloudinaryService.uploadFile(file, {
        ...FileService.uploadOptions,
        folder: users
          ? `${FileService.uploadOptions.folder}${users}/`
          : FileService.uploadOptions.folder,
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Upload file successfully',
        data: res.secure_url,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Upload file failed',
        data: error,
      };
    }
  }

  async uploadAvatar(id: string, @UploadedFile() file: Express.Multer.File) {
    try {
      const res = await this.cloudinaryService.uploadFile(file, {
        ...FileService.uploadOptions,
        folder: id
          ? `${FileService.uploadOptions.folder}${id}/`
          : FileService.uploadOptions.folder,
        overwrite: true,
        use_filename: true,
        unique_filename: false,
        format: 'png',
        public_id: 'avatar',
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Upload file successfully',
        data: res.secure_url,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Upload file failed',
        data: error,
      };
    }
  }

  async uploadAvatarWithBase64(id: string, base64: string) {
    try {
      const res = await this.cloudinaryService.cloudinary.uploader.upload(
        base64,
        {
          ...FileService.uploadOptions,
          folder: id
            ? `${FileService.uploadOptions.folder}${id}/`
            : FileService.uploadOptions.folder,
          overwrite: true,
          use_filename: true,
          unique_filename: false,
          format: 'png',
          public_id: 'avatar',
        },
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Upload file successfully',
        data: res.secure_url,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Upload file failed',
        data: error,
      };
    }
  }
}
