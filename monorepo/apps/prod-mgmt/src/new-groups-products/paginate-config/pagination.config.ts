import {
  newGroupProductsFilteredColumns,
  newGroupProductsSearchableColumns,
  newGroupProductsSortableColumns,
} from 'libs/shared/src/lib/config';
import { PaginateConfig } from 'nestjs-paginate';

import { NewGroupProductEntity } from '../../entities/new-group-product.entity';

export const newGroupProductsPaginateConfig: PaginateConfig<NewGroupProductEntity> =
  {
    sortableColumns: newGroupProductsSortableColumns as never,
    defaultSortBy: [
      ['timestamp.createdAt', 'ASC'],
      ['name', 'ASC'],
    ],
    searchableColumns: newGroupProductsSearchableColumns as never,
    filterableColumns: newGroupProductsFilteredColumns,
    maxLimit: 100,
    defaultLimit: 20,
    relations: [],
    loadEagerRelations: false,
    withDeleted: true,
  };
