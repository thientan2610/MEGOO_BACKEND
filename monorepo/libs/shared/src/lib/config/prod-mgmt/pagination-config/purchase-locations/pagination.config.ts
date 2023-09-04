import { IPaginateFilterableColumns } from 'libs/shared/src/lib/common/nest-paginate-decorators/interfaces/filter.interface';

const columns = [
  'id',
  'name',
  'addedBy',
  'description',
  'address.provinceName',
  'address.districtName',
  'address.wardName',
  'address.addressLine1',
  'address.addressLine2',
  'timestamp.createdAt',
  'timestamp.updatedAt',
  'timestamp.deletedAt',
];

// map array of strings to object with keys of strings and values of `true`
export const purchaseLocationsFilterableColumns: IPaginateFilterableColumns =
  columns.reduce((acc, val) => ({ ...acc, [val]: true }), {});

export const purchaseLocationsSortableColumns: string[] = [...columns];

export const purchaseLocationsSearchableColumns: string[] = [...columns].filter(
  (col) =>
    !col.includes('timestamp.') &&
    !col.startsWith('id') &&
    !col.endsWith('.id'),
);
