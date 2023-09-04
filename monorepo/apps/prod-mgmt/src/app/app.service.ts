import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Welcome to prod-mgmt!' };
  }

  /**
   * Validates the provided group ID.
   * @param groupId The group ID to validate.
   * @throws RpcException with status code 400 if the group ID is not provided.
   */
  public static validateGroupId(groupId: string): void {
    if (!groupId) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Group ID is required.',
      });
    }
  }
}
