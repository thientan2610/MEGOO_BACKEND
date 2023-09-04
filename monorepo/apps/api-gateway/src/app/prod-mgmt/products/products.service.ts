import {
  GetProductByBarcodeReqDto,
  GetProductByBarcodeResDto,
} from 'libs/shared/src/lib/dto/prod-mgmt/products';
import ms from 'ms';
import { firstValueFrom, timeout } from 'rxjs';

import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { kafkaTopic } from '@nyp19vp-be/shared';

import { ProductDto } from '../dto/product.dto';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @Inject('PROD_MGMT_SERVICE')
    private readonly prodMgmtClient: ClientKafka,
  ) {}
  onModuleInit() {
    this.prodMgmtClient.subscribeToResponseOf(
      kafkaTopic.PROD_MGMT.products.getByBarcode,
    );
    this.prodMgmtClient.subscribeToResponseOf(
      kafkaTopic.PROD_MGMT.products.create,
    );
  }

  public async getProductByBarcode(
    barcode: string,
  ): Promise<GetProductByBarcodeResDto> {
    try {
      const payload: GetProductByBarcodeReqDto = {
        barcode,
      };

      console.log('payload', payload);

      const response = await firstValueFrom(
        this.prodMgmtClient
          .send(
            kafkaTopic.PROD_MGMT.products.getByBarcode,
            JSON.stringify(payload),
          )
          .pipe(timeout(ms('10s'))),
      );

      console.log('response', response);
      return response;
    } catch (error) {
      console.log('Error: ', error);

      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Product information fetch failed',
      };
    }
  }

  private async createProduct(product: ProductDto): Promise<ProductDto> {
    console.log('createProduct', product);

    const payload: ProductDto = {
      ...product,
    };

    const response = await firstValueFrom(
      this.prodMgmtClient
        .send(kafkaTopic.PROD_MGMT.products.create, JSON.stringify(payload))
        .pipe(timeout(ms('10s'))),
    );

    console.log('response', response);

    return response;
  }
}
