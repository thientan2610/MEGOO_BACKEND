import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { ProductDto } from './dto/product.dto';
import { ProductsService } from './products/products.service';
import { CloneReqDto } from 'libs/shared/src/lib/dto/prod-mgmt';
import { ProdMgmtService } from './prod-mgmt.service';
import { BaseResDto } from '@nyp19vp-be/shared';

@ApiTags('route: prod-mgmt')
@Controller('prod-mgmt')
export class ProdMgmtController {
  constructor(
    private readonly productService: ProductsService,
    private readonly prodMgmtService: ProdMgmtService,
  ) {}

  @ApiOkResponse({
    type: ProductDto,
  })
  @ApiQuery({
    name: 'barcode',
    required: true,
    description: 'Barcode of the product',
    example: '8935049004226',
  })
  @Get('product-by-barcode')
  getProductByBarcode(@Query('barcode') barcode: string) {
    return this.productService.getProductByBarcode(barcode);
  }

  @ApiOperation({
    summary:
      'Clone data from one database to another. This is a long running task.',
  })
  @ApiOkResponse({
    type: BaseResDto,
  })
  @Post('clone')
  cloneData(@Body() redDto: CloneReqDto) {
    return this.prodMgmtService.clone(redDto);
  }
}
