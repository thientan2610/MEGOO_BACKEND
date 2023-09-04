import {
  CollectionProperties,
  Expose,
} from '@forlagshuset/nestjs-mongoose-paginate';

export class BaseCollectionProperties extends CollectionProperties {
  @Expose({ name: '_id', default: true })
  readonly _id;

  @Expose({ name: 'createdAt', sortable: true })
  readonly createdAt: 'desc' | 'asc';

  @Expose({ name: 'name', sortable: true, default: true, filterable: true })
  readonly name: 'desc' | 'asc';

  readonly unsortable: string;
}
