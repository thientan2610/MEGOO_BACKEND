import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  Contains,
  IsAlpha,
  IsAlphanumeric,
  IsEnum,
  IsOptional,
  IsUrl,
  Length,
} from 'class-validator';

export class VNPCreateOrderReqDto {
  @ApiProperty({
    description: 'VnPay version',
    enum: ['2.0.1', '2.1.0'],
    required: true,
  })
  @IsEnum(['2.0.1', '2.1.0'])
  @Length(1, 8)
  vnp_Version: string;

  @ApiProperty({
    description: 'Api code; Api code for payment: pay',
    required: true,
  })
  @Length(1, 16)
  @IsAlpha()
  @Contains('pay')
  vnp_Command: string;

  @ApiProperty({ description: 'App code on VNPAY', required: true })
  @Length(8, 8)
  @IsAlphanumeric()
  vnp_TmnCode: string;

  @ApiProperty({
    description:
      'Payment amount. Amount does not carry decimal separators, thousandths, currency characters. To send a payment amount of 10,000 VND (ten thousand VND), merchant needs to multiply by 100 times (decimal), then send to VNPAY: 1000000',
    required: true,
  })
  vnp_Amount: number;

  @ApiProperty({ description: 'Bank code', required: false })
  @IsAlphanumeric()
  @Length(3, 20)
  @IsOptional()
  vnp_BankCode?: string;

  @ApiProperty({
    description: 'Transaction time; Format: yyyyMMddHHmmss(Time zone GMT+7)',
    required: true,
  })
  vnp_CreateDate: number;

  @ApiProperty({ description: 'Currency code', default: 'VND', required: true })
  @IsAlpha()
  @Length(3, 3)
  vnp_CurrCode: string;

  @ApiProperty({
    description: 'IP address of the client making the transaction',
    required: true,
  })
  @Length(7, 45)
  vnp_IpAddr: string;

  @ApiProperty({
    description: 'Display language',
    enum: ['vn', 'en'],
    required: true,
  })
  @IsAlpha()
  @Length(2, 5)
  @IsEnum(['vn', 'en'])
  vnp_Locale: string;

  @ApiProperty({
    description: 'Description of payment (Vietnamese, unsigned)',
    required: true,
  })
  @Length(1, 255)
  vnp_OrderInfo: string;

  @ApiProperty({ description: 'Commodity codes', required: false })
  @IsAlpha()
  @Length(1, 100)
  @IsOptional()
  vnp_OrderType?: string;

  @ApiProperty({
    description:
      'The URL notifies the transaction results when the Customer finishes the payment',
    required: true,
  })
  @Length(10, 255)
  @IsUrl()
  vnp_ReturnUrl: string;

  @ApiProperty({ description: 'Transaction ID', required: true })
  @Length(1, 100)
  vnp_TxnRef: string;

  @ApiProperty({
    description:
      "Checksum code to ensure the transaction's data is not changed during the transition from merchant to VNPAY.",
    required: false,
  })
  @IsOptional()
  vnp_SecureHash?: string;
}

export class VNPIpnUrlReqDto extends PickType(VNPCreateOrderReqDto, [
  'vnp_TmnCode',
  'vnp_Amount',
  'vnp_BankCode',
  'vnp_OrderInfo',
  'vnp_TxnRef',
  'vnp_SecureHash',
]) {
  @ApiProperty({
    required: false,
    description: 'Transaction code at the Bank',
    example: 'NCB20170829152730',
  })
  @IsOptional()
  vnp_BankTranNo?: string;

  @ApiProperty({
    required: false,
    description: 'Type of account/card used by customers: ATM, QRCODE',
  })
  @IsOptional()
  vnp_CardType?: string;

  @ApiProperty({
    required: false,
    description: 'Payment date. Format: yyyyMMddHHmmss',
  })
  @IsOptional()
  vnp_PayDate?: number;

  @ApiProperty({
    required: true,
    description: 'Transaction code recorded at VNPAY system',
  })
  vnp_TransactionNo: number;

  @ApiProperty({
    required: true,
    description:
      'Payment result response code. Specify a 00 response code for a Success result for all APIs.',
  })
  vnp_ResponseCode: number;

  @ApiProperty({
    required: true,
    description:
      'Payment result response code. Status of the transaction at VNPAY Payment Gateway.\n\n\t-00: Payment transaction is done successfully at VNPAY\n\n\t-Other than 00: Transaction failed at VNPAY',
  })
  vnp_TransactionStatus: number;

  @ApiProperty({
    required: false,
    description: 'Type of hash code: SHA256, HmacSHA512',
  })
  @IsOptional()
  vnp_SecureHashType?: string;
}
