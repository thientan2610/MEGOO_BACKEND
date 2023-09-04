import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SocialAccountReqDto {
  @ApiProperty()
  googleAccessToken?: string;

  @ApiProperty({
    name: 'provider',
    description: 'Provider name',
    example: 'google',
  })
  @IsNotEmpty()
  @IsString()
  provider: string;

  @ApiProperty({
    name: 'providerId',
  })
  @IsNotEmpty()
  @IsString()
  providerId: string;

  @ApiProperty({
    name: 'name',
    example: 'Minh Thoai',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    name: 'email',
    example: 'minhthoai1250@gmail.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    name: 'photo',
    example:
      'https://res.cloudinary.com/nmphat/image/upload/v1667186202/cld-sample.jpg',
  })
  @IsNotEmpty()
  @IsString()
  photo: string;
}
