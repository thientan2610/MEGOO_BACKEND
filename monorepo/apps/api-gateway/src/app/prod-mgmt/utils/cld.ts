import {
  UploadApiErrorResponse,
  UploadApiOptions,
  UploadApiResponse,
} from 'cloudinary';
import moment from 'moment';
import { CloudinaryService } from 'nestjs-cloudinary';

/**
 * Uploads an image file to Cloudinary for a group product with the specified ID.
 * @param file The image file to upload.
 * @param id The ID of the group product to associate the uploaded image with.
 * @returns A promise that resolves to the URL of the uploaded image, null if upload fail
 */
export const uploadImage = async (
  cloudinaryService: CloudinaryService,
  uploadOptions: UploadApiOptions,
  file: Express.Multer.File | string,
  id: string = null,
): Promise<string> => {
  console.log('upload image for id ', id);

  console.log(typeof file);

  let res: UploadApiResponse | UploadApiErrorResponse = null;

  try {
    if (typeof file === 'object') {
      res = await cloudinaryService.uploadFile(file as never, {
        ...uploadOptions,
        public_id: id,
      });
    } else if (typeof file === 'string') {
      res = await cloudinaryService.cloudinary.uploader.upload(file as never, {
        ...uploadOptions,
        public_id: id,
      });
    } else {
      // throw error if file is neither a string nor an Express.Multer.File
      throw new Error('Invalid file type');
    }

    return res.secure_url + '?updatedAt=' + moment().toDate().getTime();
  } catch (error) {
    // log error
    console.error(error);

    // return undefined if upload fail
    return undefined;
  }
};
