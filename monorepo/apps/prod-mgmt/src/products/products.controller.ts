import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductsService } from './products.service';
import { kafkaTopic } from '@nyp19vp-be/shared';
import {
  GetProductByBarcodeReqDto,
  GetProductByBarcodeResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/products';
import { ProductEntity } from '../entities/product.entity';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern(kafkaTopic.PROD_MGMT.products.getByBarcode)
  async getProductByBarcode(
    @Payload() data: GetProductByBarcodeReqDto,
  ): Promise<GetProductByBarcodeResDto> {
    console.log('getProductByBarcode', data);

    return await this.productsService.getProductByBarcode(data.barcode);
  }

  @MessagePattern(kafkaTopic.PROD_MGMT.products.create)
  async createProduct(@Payload() data: ProductEntity) {
    console.log('createProduct', data);

    return await this.productsService.createProduct(data);
  }
}
