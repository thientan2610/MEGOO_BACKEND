import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiProperty,
  ApiQuery,
  getSchemaPath,
} from '@nestjs/swagger';
import { FilterOperator } from 'nestjs-paginate';
import { IPaginateFilterableColumns } from './interfaces/filter.interface';

/**
 * DTO class representing the metadata of a paginated response.
 */
class PaginatedResponseMetaDto {
  @ApiProperty()
  itemsPerPage: number;
  @ApiProperty()
  totalItems: number;
  @ApiProperty()
  currentPage: number;
  @ApiProperty()
  totalPages: number;
  @ApiProperty()
  sortBy: string[][];
  @ApiProperty()
  searchBy: string[];
  @ApiProperty()
  search: string;
  @ApiProperty({ required: false })
  filter?: Record<string, string | string[]>;
}

/**
 * DTO class representing the links of a paginated response.
 */
class PaginatedResponseLinksDto {
  @ApiProperty({ required: false })
  first?: string;
  @ApiProperty({ required: false })
  previous?: string;
  @ApiProperty()
  current: string;
  @ApiProperty({ required: false })
  next?: string;
  @ApiProperty({ required: false })
  last?: string;
}

/**
 * DTO class representing a paginated response.
 * @template T The type of the data being paginated.
 */
class PaginatedResponseDto<T> {
  data: T[];
  @ApiProperty()
  meta: PaginatedResponseMetaDto;
  @ApiProperty()
  links: PaginatedResponseLinksDto;
}

/**
 * Returns a string describing the format of the sortBy parameter.
 * @param sortableColumns An array of strings representing the columns that can be sorted.
 * @returns A string describing the format of the sortBy parameter.
 */
const getSortByDesc = (sortableColumns: string[]) => {
  return `Format: _field_:_direction_ [direction may be ASC or DESC]. (e.g. id:ASC)\n\n
  sortBy could be used multiples times. (e.g. id:ASC&sortBy=username:DESC)\n\n
  The columns support:\n\n **${sortableColumns}**`;
};

/**
 * Returns a string describing the format of the filter parameter.
 * @param filterOperators An array of FilterOperator enum values representing the comparison operators that can be used in the filter parameter.
 * @returns A string describing the format of the filter parameter.
 */
const getFilterDesc = (filterOperators: FilterOperator[]): string => {
  let filterDesc =
    'Format: $_comp_:_value_ or $not:$_comp_:_value_ (_comp_ may be ';

  filterDesc += filterOperators;

  filterDesc += ')';
  return filterDesc;
};

/**
 * Returns a set of NestJS decorators that can be used to define pagination and filtering options for a paginated response.
 * @template DataDto The DTO class representing the data being paginated.
 * @param dataDto The DTO class representing the data being paginated.
 * @param searchableColumns An array of strings representing the columns that can be searched.
 * @param sortableColumns An array of strings representing the columns that can be sorted.
 * @param filterFields An object representing the columns that can be filtered, and the filter operators that can be used on each column.
 * @returns A set of NestJS decorators that can be used to define pagination and filtering options for a paginated response.
 */
export function PaginateQueryOptions<DataDto extends Type<unknown>>(
  dataDto: DataDto,
  searchableColumns: string[],
  sortableColumns: string[],
  filterFields: IPaginateFilterableColumns,
) {
  return applyDecorators(
    ApiExtraModels(PaginatedResponseDto, dataDto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              statusCode: {
                type: 'int',
                example: HttpStatus.OK,
              },
              message: {
                type: 'string',
                example: 'OK',
              },
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(dataDto) },
              },
            },
          },
        ],
      },
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: 'Page number (starting from 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Number of records per page',
      example: 20,
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: `Multi-column search term. Search all Multi-column, default:\n\n **${searchableColumns}**`,
    }),
    ApiQuery({
      name: 'searchBy',
      required: false,
      description: `Limit columns to which apply 'search' term. The columns support:\n\n **${searchableColumns}**`,
      isArray: true,
      type: 'string',
    }),

    ApiQuery({
      name: 'sortBy',
      required: false,
      description: getSortByDesc(sortableColumns),
      type: 'string',
      isArray: true,
    }),

    ...Object.keys(filterFields).map((key) =>
      ApiQuery({
        name: 'filter.' + key,
        required: false,
        description:
          filterFields[key] === true
            ? 'Format: $_comp_:_value_ or $not:$_comp_:_value_ [comp may be $eq, $not, $null, $in, $gt, $gte, $lt, $lte, $btw, $ilike] (e.g. $eq:1, $not:$ilike:1)'
            : getFilterDesc(filterFields[key] as FilterOperator[]),
      }),
    ),
  );
}
