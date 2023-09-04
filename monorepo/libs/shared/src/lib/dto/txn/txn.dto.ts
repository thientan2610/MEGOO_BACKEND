import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, ValidateNested } from 'class-validator';

export class ItemDto {
  @ApiProperty({
    description: 'Package ID',
    type: String,
    example: '640ac2ccf227ec441cd97d7b',
  })
  id: string;

  @ApiProperty({
    description: 'Package name',
    type: String,
    example: 'Package No.1',
  })
  name: string;

  @ApiProperty({
    description:
      '- Unit price of a package;\n\n- Default currency: VND;\n\n- Example: 10000 => 10',
    type: Number,
    minimum: 100000,
    example: 100000,
  })
  price: number;

  @ApiProperty({
    description: 'Quantity of package',
    type: Number,
    minimum: 1,
    example: 1,
  })
  quantity: number;

  @ApiProperty({ minimum: 1 })
  duration: number;

  @ApiProperty({ minimum: 2 })
  noOfMember: number;
}

class PaymentMethodDto {
  @ApiProperty({ type: String, required: true })
  type: string;

  @ApiProperty({ type: String, required: true })
  name: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  trans_id?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  embed_data?: string;
}

export class CreateTransReqDto {
  @ApiProperty({
    type: String,
    description: 'Transaction Id <app_trans_id>',
    example: '230423_221232469',
    required: true,
  })
  _id: string;

  @ApiProperty({
    type: String,
    description: 'User Id <app_user>',
    example: '64453668e9e2e696d56ed2a1',
    required: true,
  })
  user: string;

  @ApiProperty({ required: true })
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  item: ItemDto[];

  @ApiProperty({
    type: Number,
    minimum: 100000,
    required: true,
    example: 100000,
  })
  @IsNumber()
  amount: number;

  @ValidateNested()
  @Type(() => PaymentMethodDto)
  @IsOptional()
  method?: PaymentMethodDto;
}
