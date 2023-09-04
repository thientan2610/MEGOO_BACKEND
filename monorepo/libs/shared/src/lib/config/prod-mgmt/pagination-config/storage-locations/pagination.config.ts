import { IPaginateFilterableColumns } from 'libs/shared/src/lib/common/nest-paginate-decorators/interfaces/filter.interface';

export const columns = [
  'id',
  'name',
  'addedBy',
  'description',
  'timestamp.createdAt',
  'timestamp.updatedAt',
  'timestamp.deletedAt',
];

// map array of strings to object with keys of strings and values of `true`
export const storageLocationsFilterableColumns: IPaginateFilterableColumns =
  columns.reduce((acc, val) => ({ ...acc, [val]: true }), {});

export const storageLocationsSortableColumns: string[] = [...columns];

export const storageLocationsSearchableColumns: string[] = [...columns].filter(
  (col) =>
    !col.includes('timestamp.') &&
    !col.startsWith('id') &&
    !col.endsWith('.id'),
);
