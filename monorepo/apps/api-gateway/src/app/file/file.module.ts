import { Global, Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { NestCloudinaryClientModule } from './cloudinary/cloudinary.module';

@Global()
@Module({
  controllers: [FileController],
  providers: [FileService],
  imports: [NestCloudinaryClientModule],
})
export class FileModule {}
