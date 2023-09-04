import { FilterOperator, FilterSuffix } from 'nestjs-paginate/lib/filter';

export interface IPaginateFilterableColumns {
  [key: string]: (FilterOperator | FilterSuffix)[] | true;
}
