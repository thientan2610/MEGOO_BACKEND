import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ProductsService } from './products.service';

@ApiTags('route: prod-mgmt')
@Controller('prod-mgmt/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
}
