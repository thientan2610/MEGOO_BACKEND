import { Expose } from '@forlagshuset/nestjs-mongoose-paginate';
import { BaseCollectionProperties } from '../base.properties';

export class TxnCollectionProperties extends BaseCollectionProperties {
  @Expose({ name: 'user', default: true, filterable: true })
  readonly user;

  @Expose({ name: 'amount', sortable: true, default: true, filterable: true })
  readonly amount: 'desc' | 'asc';
}
