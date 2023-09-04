import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PkgMgmtService } from './pkg-mgmt.service';

@ApiTags('Package Management')
@Controller('pkg-mgmt')
export class PkgMgmtController {
  constructor(private readonly pkgMgmtService: PkgMgmtService) {}
}
