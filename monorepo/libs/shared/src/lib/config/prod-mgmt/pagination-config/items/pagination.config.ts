import { IPaginateFilterableColumns } from 'libs/shared/src/lib/common/nest-paginate-decorators/interfaces/filter.interface';
import { FilterOperator } from 'nestjs-paginate';

const columns = [
  // ItemEntity
  'id',
  'addedBy',
  'bestBefore',
  'quantity',
  'unit',
  'timestamp.createdAt',
  'timestamp.updatedAt',
  'timestamp.deletedAt',

  // GroupProductEntity
  'groupProduct.id',
  'groupProduct.barcode',
  'groupProduct.name',
  'groupProduct.category',
  'groupProduct.brand',
  'groupProduct.description',
  'groupProduct.price',
  'groupProduct.region',

  // PurchaseLocationEntity
  'purchaseLocation.id',

  // StorageLocationEntity
  'storageLocation.id',
];

// map array of strings to object with keys of strings and values of `true`
// but, for `purchaseLocation.id` and `storageLocation.id`, the values is `FilterOperator.EQ`
export const itemsFilterableColumns: IPaginateFilterableColumns = {
  ...columns.reduce((acc, val) => ({ ...acc, [val]: true }), {}),
  'purchaseLocation.id': [FilterOperator.EQ],
  'storageLocation.id': [FilterOperator.EQ],
};

export const itemsSortableColumns: string[] = [...columns];

export const itemsSearchableColumns: string[] = columns.filter(
  (col) =>
    !col.includes('timestamp.') && !col.startsWith('id') && !col.endsWith('id'),
);
