import { ApiProperty } from '@nestjs/swagger';
import { IProduct } from '../interfaces/product.interface';

export class ProductDto implements IProduct {
  @ApiProperty({
    type: 'string',
    example: 'Sữa Tươi Nuti Milk 100 Điểm 180ml',
  })
  name: string;

  @ApiProperty({
    type: 'string',
    example: 'https://go-upc.s3.amazonaws.com/images/70048411.jpeg',
  })
  image: string;

  @ApiProperty({
    type: 'string',
    example: '8935049004226',
  })
  barcode: string;

  @ApiProperty({
    type: 'string',
    example: 'Vietnam',
  })
  region: string;

  @ApiProperty({
    type: 'string',
    example: 'NutiFood',
  })
  brand: string;

  @ApiProperty({
    type: 'string',
    example: 'Milk',
  })
  category: string;

  @ApiProperty({
    type: 'string',
    example: 'Sữa tươi Nuti Milk 100 Điểm 180ml',
  })
  description: string;
}
