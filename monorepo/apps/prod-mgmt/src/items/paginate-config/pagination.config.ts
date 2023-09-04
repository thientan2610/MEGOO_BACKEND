import { PaginateConfig } from 'nestjs-paginate';

import {
  itemsSearchableColumns,
  itemsSortableColumns,
  itemsFilterableColumns,
} from 'libs/shared/src/lib/config';
import { ItemEntity } from '../../entities/item.entity';

export const itemsPaginateConfig: PaginateConfig<ItemEntity> = {
  sortableColumns: itemsSortableColumns as never,
  defaultSortBy: [['timestamp.createdAt', 'ASC']],
  searchableColumns: itemsSearchableColumns as never,
  filterableColumns: itemsFilterableColumns,
  maxLimit: 100,
  defaultLimit: 20,
  relations: ['groupProduct', 'purchaseLocation', 'storageLocation'],
  loadEagerRelations: true,
  withDeleted: false,
};
