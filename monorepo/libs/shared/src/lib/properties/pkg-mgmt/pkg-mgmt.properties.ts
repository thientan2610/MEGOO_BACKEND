import { Expose } from '@forlagshuset/nestjs-mongoose-paginate';
import { BaseCollectionProperties } from '../base.properties';

export class PkgCollectionProperties extends BaseCollectionProperties {
  @Expose({ name: 'duration', default: true, filterable: true, sortable: true })
  readonly duration: 'desc' | 'asc';

  @Expose({
    name: 'noOfMember',
    default: true,
    filterable: true,
    sortable: true,
  })
  readonly member: 'desc' | 'asc';

  @Expose({ name: 'price', sortable: true, default: true, filterable: true })
  readonly price: 'desc' | 'asc';
}

export class GrCollectionProperties extends BaseCollectionProperties {
  @Expose({
    name: 'members',
    default: true,
    filterable: true,
    sortable: true,
  })
  readonly members: 'desc' | 'asc';
}
