import { Injectable, PipeTransform } from '@nestjs/common';
import { PaginationParams, ProjectionParams } from '@nyp19vp-be/shared';
import { SorterParser, ProjectionParser } from './parse';

@Injectable()
export class GrsValidationPipe implements PipeTransform {
  transform(value: PaginationParams) {
    const sorterParams = new SorterParser().parse(value.sort);
    const projParams = new ProjectionParser().parse(value.projection);
    const { sort: _, projection, ...rest } = value;
    return { ...rest, sorter: sorterParams, proj: projParams };
  }
}

export class GrValidationPipe implements PipeTransform {
  transform(value: ProjectionParams) {
    const projParams = new ProjectionParser().parse(value.projection);
    const { projection: _, ...rest } = value;
    return { ...rest, proj: projParams };
  }
}
