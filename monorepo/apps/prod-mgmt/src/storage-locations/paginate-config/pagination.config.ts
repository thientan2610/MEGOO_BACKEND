import {
  storageLocationsFilterableColumns,
  storageLocationsSearchableColumns,
  storageLocationsSortableColumns,
} from 'libs/shared/src/lib/config';
import { PaginateConfig } from 'nestjs-paginate';

import { StorageLocationEntity } from '../../entities/storage-location.entity';

export const storageLocationsPaginateConfig: PaginateConfig<StorageLocationEntity> =
  {
    sortableColumns: storageLocationsSortableColumns as never,
    defaultSortBy: [
      ['timestamp.createdAt', 'ASC'],
      ['name', 'ASC'],
      ['addedBy', 'ASC'],
      ['description', 'ASC'],
    ],
    searchableColumns: storageLocationsSearchableColumns as never,
    filterableColumns: storageLocationsFilterableColumns,
    maxLimit: 100,
    defaultLimit: 20,
    relations: [],
    loadEagerRelations: true,
    withDeleted: true,
  };
