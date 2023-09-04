import { IPaginateFilterableColumns } from 'libs/shared/src/lib/common/nest-paginate-decorators/interfaces/filter.interface';

const columns = [
  'id',
  'barcode',
  'name',
  'category',
  'brand',
  'description',
  'price',
  'region',
  'timestamp.createdAt',
  'timestamp.updatedAt',
  'timestamp.deletedAt',
];

export const groupProductsFilteredColumns: IPaginateFilterableColumns =
  columns.reduce((acc, col) => {
    acc[col] = true;
    return acc;
  }, {});

export const groupProductsSortableColumns: string[] = [...columns];

export const groupProductsSearchableColumns: string[] = [...columns].filter(
  (col) =>
    !col.includes('timestamp.') &&
    !col.startsWith('id') &&
    !col.endsWith('.id'),
);
