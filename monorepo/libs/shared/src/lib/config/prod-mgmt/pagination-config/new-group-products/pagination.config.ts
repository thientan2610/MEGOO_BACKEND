import { IPaginateFilterableColumns } from 'libs/shared/src/lib/common/nest-paginate-decorators/interfaces/filter.interface';

const columns = [
  'id',
  'name',
  'image',
  'price',
  'bestBefore',
  'description',
  'interval',
  'intervalType',
  'lastNotification',
  'nextNotification',
  'timestamp.createdAt',
  'timestamp.updatedAt',
  'timestamp.deletedAt',

  'groupId',
];

export const newGroupProductsFilteredColumns: IPaginateFilterableColumns =
  columns.reduce((acc, col) => {
    acc[col] = true;
    return acc;
  }, {});

export const newGroupProductsSortableColumns: string[] = [...columns];

export const newGroupProductsSearchableColumns: string[] = [...columns].filter(
  (col) =>
    !col.includes('timestamp.') &&
    !col.startsWith('id') &&
    !col.endsWith('.id'),
);
