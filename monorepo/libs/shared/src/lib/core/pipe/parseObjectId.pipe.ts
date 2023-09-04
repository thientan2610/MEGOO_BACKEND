import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { isMongoId } from 'class-validator';
import { ObjectId } from 'mongodb';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, ObjectId> {
  transform(value: string, metadata: ArgumentMetadata): any {
    try {
      return new ObjectId(value);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
