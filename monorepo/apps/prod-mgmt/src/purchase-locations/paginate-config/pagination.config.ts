import {
  purchaseLocationsFilterableColumns,
  purchaseLocationsSearchableColumns,
  purchaseLocationsSortableColumns,
} from 'libs/shared/src/lib/config';
import { PaginateConfig } from 'nestjs-paginate';

import { PurchaseLocationEntity } from '../../entities/purchase-location.entity';

export const purchaseLocationsPaginateConfig: PaginateConfig<PurchaseLocationEntity> =
  {
    sortableColumns: purchaseLocationsSortableColumns as never,
    defaultSortBy: [
      ['timestamp.createdAt', 'ASC'],
      ['name', 'ASC'],
      ['addedBy', 'ASC'],
      ['address.provinceName', 'ASC'],
      ['address.districtName', 'ASC'],
      ['address.wardName', 'ASC'],
      ['address.addressLine1', 'ASC'],
      ['address.addressLine2', 'ASC'],
    ],
    searchableColumns: purchaseLocationsSearchableColumns as never,
    filterableColumns: purchaseLocationsFilterableColumns,
    maxLimit: 100,
    defaultLimit: 20,
    relations: [],
    loadEagerRelations: true,
    withDeleted: true,
  };
