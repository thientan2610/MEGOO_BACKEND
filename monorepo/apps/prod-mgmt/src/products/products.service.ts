import moment from 'moment';
import validbarcode from 'barcode-validator';

import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GetProductByBarcodeResDto } from 'libs/shared/src/lib/dto/prod-mgmt/products';
import { Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { fetchProductDataFromGoUpc } from '../utils/go-upc';
import { ProductDto } from 'libs/shared/src/lib/dto/prod-mgmt/dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  /**
   * Retrieves a product from the database by its barcode.
   * If the product is not found in the database, it tries to fetch it from an external API and saves it to the database.
   * @param barcode The barcode of the product to retrieve.
   * @returns A Promise that resolves to a GetProductByBarcodeResDto object containing the retrieved product data.
   */
  async getProductByBarcode(
    barcode: string,
  ): Promise<GetProductByBarcodeResDto> {
    // check barcode is valid
    if (!validbarcode(barcode)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid barcode',
      };
    }

    // Find from db
    let product = await this.productRepo.findOne({
      where: { barcode },
    });

    if (!product) {
      console.log(
        `product with barcode #${barcode} is not exist in db. Try to find online`,
      );
      // try to find from external api
      const productData: ProductDto = await fetchProductDataFromGoUpc(barcode);

      if (productData) {
        const newProduct = this.productRepo.create(productData);

        product = await this.productRepo.save(newProduct);
      }
    }

    return {
      statusCode: product ? HttpStatus.OK : HttpStatus.NOT_FOUND,
      message: product ? 'Get product successfully' : 'Product not found',
      data: product,
    };
  }

  /**
   * Creates a new product in the database.
   * If a product with the same barcode already exists in the database, it returns the existing product.
   * @param data The product data to create.
   * @returns A Promise that resolves to the created product data.
   */
  async createProduct(data: ProductEntity): Promise<ProductEntity> {
    // check if product already exists
    const product = await this.productRepo.findOne({
      where: { barcode: data.barcode },
    });

    if (product) {
      return product;
    }

    const newProduct = this.productRepo.create(data);

    await this.productRepo.save(newProduct);

    return {
      ...newProduct,
    };
  }

  private static extractProductDataFromCsvRow(row: string): ProductEntity {
    const [
      id,
      barcode,
      brand,
      category,
      description,
      image,
      name,
      price,
      region,
      createdAt,
      updatedAt,
      deletedAt,
    ] = row.split(',');

    return {
      id: id,
      barcode: barcode,
      brand: brand,
      category: category,
      description: description,
      image: image,
      name: name,
      price: +price,
      region: region,
      timestamp: {
        createdAt: moment(createdAt).toDate(),
        updatedAt: moment(updatedAt).toDate(),
        deletedAt: moment(deletedAt).toDate(),
      },
    };
  }
}
