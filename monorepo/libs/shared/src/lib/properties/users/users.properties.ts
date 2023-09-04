import { Expose } from '@forlagshuset/nestjs-mongoose-paginate';
import { BaseCollectionProperties } from '../base.properties';

export class UsersCollectionProperties extends BaseCollectionProperties {
  @Expose({ name: 'phone', default: true, filterable: true })
  readonly phone;

  @Expose({ name: 'email', sortable: true, default: true, filterable: true })
  readonly email: 'desc' | 'asc';
}
