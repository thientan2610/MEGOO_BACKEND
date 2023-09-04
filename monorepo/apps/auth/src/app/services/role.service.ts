import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { RoleEntity } from '../entities/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private roleRepo: Repository<RoleEntity>,
  ) {}

  getData(): { message: string } {
    return { message: 'Welcome to auth/Role!' };
  }

  create(data: object): RoleEntity {
    return this.roleRepo.create(data);
  }
}
