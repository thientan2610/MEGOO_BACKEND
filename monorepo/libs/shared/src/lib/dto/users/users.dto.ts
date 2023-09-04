import {
  ApiProperty,
  IntersectionType,
  OmitType,
  PickType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsAscii,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsUrl,
  Min,
} from 'class-validator';
import { IsBoolean, IsString, ValidateNested } from 'class-validator';
import { BaseResDto, IdDto } from '../base.dto';
import { PackageDto } from '../pkg-mgmt/package.dto';
import { ERole } from '@nyp19vp-be/shared';

class UserSetting {
  @ApiProperty({
    type: Boolean,
    default: true,
  })
  @IsBoolean()
  stockNoti: boolean;

  @ApiProperty({
    type: Boolean,
    default: true,
  })
  @IsBoolean()
  callNoti: boolean;

  @ApiProperty({
    type: Boolean,
    default: true,
  })
  @IsBoolean()
  msgNoti: boolean;

  @ApiProperty({
    type: Boolean,
    default: true,
  })
  @IsBoolean()
  newsNoti: boolean;
}

export class UserInfo extends IdDto {
  @ApiProperty({
    description: 'name of user, must be an ascii string',
    type: String,
    example: 'night owl',
    required: true,
    nullable: false,
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'date of birth of user',
    type: Date,
    example: '2001-01-01',
  })
  @IsDateString()
  @IsOptional()
  dob?: Date;

  @ApiProperty({
    description:
      'phone number of user, must be an valid VIETNAMESE phone number',
    example: '0987654321',
    minimum: 10,
    maximum: 12,
    required: false,
  })
  @Transform(({ value }) => value.replace(/^0/, '+84'))
  @IsPhoneNumber('VI')
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Email of user, must be an ascii string',
    example: 'example@ex.com',
    required: true,
    nullable: false,
    minLength: 1,
    maxLength: 255,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Avatar of user. Only supported upload file',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  avatar?: string;

  @ApiProperty({
    enum: ERole,
  })
  @IsEnum(ERole)
  role?: string;
}

export class Items {
  @ApiProperty({
    description: 'Package ID',
    type: String,
    example: '640ac2ccf227ec441cd97d7b',
  })
  package: string;

  @ApiProperty({
    description: 'Quantity of package',
    type: Number,
    minimum: 1,
    example: 1,
  })
  quantity: number;

  @ApiProperty({
    description: "Number of package'member",
    type: Number,
    minimum: 2,
  })
  @IsOptional()
  @Min(2)
  noOfMember?: number;

  @ApiProperty({
    description: 'Duration of package',
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @Min(1)
  duration?: number;
}

export class Item extends OmitType(Items, ['quantity']) {}

class UserSettingDto {
  @ApiProperty()
  @Type(() => UserSetting)
  @ValidateNested()
  setting: UserSetting;
}

export class TrxHistDto {
  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  trxHist: string[];
}

export class CartDto {
  @ApiProperty({
    example: [
      {
        package: '640ac2ccf227ec441cd97d7b',
        quantity: 1,
        noOfMember: 2,
        duration: 1,
      },
    ],
  })
  @Type(() => Items)
  @ValidateNested({ each: true })
  @IsArray()
  cart: Items[];
}

export class UserDto extends IntersectionType(
  UserInfo,
  UserSettingDto,
  TrxHistDto,
  CartDto,
) {}

export class UpdateTrxHistReqDto extends IntersectionType(IdDto, CartDto) {
  @ApiProperty({ description: 'Transaction Id paid by user' })
  trx: string;
}

export class GetUserResDto extends BaseResDto {
  @ApiProperty()
  @Type(() => UserInfo)
  @ValidateNested()
  user: UserDto;
}

export class GetUserSettingResDto extends IntersectionType(
  BaseResDto,
  UserSettingDto,
) {}

export class CreateUserReqDto extends OmitType(UserInfo, ['_id']) {}

export class UpdateUserReqDto extends IntersectionType(
  IdDto,
  OmitType(UserInfo, ['email', 'avatar', 'role']),
) {}

export class UpdateSettingReqDto extends IntersectionType(IdDto, UserSetting) {}

export class UpdateAvatarReqDto extends IntersectionType(
  IdDto,
  PickType(UserInfo, ['avatar']),
) {}

export class UpdateAvatarWithBase64 {
  @ApiProperty({
    description: 'Base64 string of image',
    type: String,
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  @IsString()
  @IsAscii()
  base64: string;
}

export class CartPackage extends PackageDto {
  @ApiProperty({
    description: 'Quantity of package',
    type: Number,
    minimum: 1,
    example: 1,
  })
  quantity: number;
}

export class GetCartResDto extends IntersectionType(BaseResDto) {
  @ApiProperty() cart: CartPackage[];
}

export class UpdateCartReqDto extends IntersectionType(IdDto, CartDto) {}

class PaymentMethod {
  @ApiProperty({
    description: 'Method of Payment',
    enum: ['TRANSFER', 'PLAYSTORE', 'EWALLET'],
    example: 'EWALLET',
    required: true,
  })
  @Transform(({ value }) => value.toUpperCase())
  type: string;

  @ApiProperty({
    description:
      '\t- Bank code if type: TRANSFER;\n\n\t- Name of wallet if type: EWALLET',
    example: 'ZALOPAY',
    required: true,
  })
  @Transform(({ value }) => value.toUpperCase())
  bank_code: string;
}

export class CheckoutReqDto extends UpdateCartReqDto {
  @IsOptional()
  group?: string;

  @ApiProperty({
    type: String,
    description: 'Method of payment. Please enter UPPERCASE',
    example: { type: 'EWALLET', bank_code: 'ZALOPAY' },
    required: true,
  })
  @Type(() => PaymentMethod)
  @ValidateNested()
  method: PaymentMethod;

  ipAddr: string;
}

export class RenewGrPkgReqDto extends IntersectionType(
  IdDto,
  PickType(CheckoutReqDto, ['group', 'method', 'ipAddr']),
) {
  @ApiProperty()
  @ValidateNested()
  @Type(() => Items)
  cart: Item;
}
