import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';

export class TimestampEmbeddedEntity {
  @ApiProperty({
    description: 'Created at',
    type: Date,
  })
  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at',
    type: Date,
  })
  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Deleted at',
    type: Date,
  })
  @DeleteDateColumn({
    name: 'deleted_at',
  })
  deletedAt: Date;
}
