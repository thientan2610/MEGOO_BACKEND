import { ApiProperty } from '@nestjs/swagger';

export class TimestampEmbeddedDto {
  @ApiProperty({
    description: 'Created at',
    type: Date,
    required: false,
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Updated at',
    type: Date,
  })
  updatedAt?: Date;

  @ApiProperty({
    description: 'Deleted at',
    type: Date,
  })
  deletedAt?: Date;
}
