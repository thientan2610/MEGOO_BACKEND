import { Controller } from '@nestjs/common';
import { PkgMgmtSvcService } from './pkg-mgmt-svc.service';

@Controller()
export class PkgMgmtSvcController {
  constructor(private readonly pkgMgmtSvcService: PkgMgmtSvcService) {}
}
