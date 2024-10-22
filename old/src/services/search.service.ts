import { Injectable } from '@nestjs/common';
import * as Joi from 'joi';
import { FilterQuery } from 'mongoose';
import {
  SortDirectionEnum,
  SortQueryData,
  TableQueryParams,
} from '../types/utils.types';

@Injectable()
export class SearchService {
  validateSearchParams(query, schema: Joi.ObjectSchema) {
    const validation = schema.validate(query);
    if (validation.error) {
      return validation.error.details;
    }
    return [];
  }
  queryToFilterParams<T>({ search, sort }: TableQueryParams<T>): {
    filterQuery: FilterQuery<T>;
    sortQuery: SortQueryData<T>;
  } {
    const filterQuery = Object.entries(search || {}).reduce<FilterQuery<T>>(
      (acc, [property, text]) => {
        return { ...acc, [property]: new RegExp(String(text)) };
      },
      {},
    );

    const sortQuery = Object.entries(sort || {}).reduce<any>(
      (acc, [property, dir]) => {
        const value = this.sortDirectionToNumber(dir as SortDirectionEnum);
        if (value === null) {
          return acc;
        }
        return { ...acc, [property]: value };
      },
      {},
    );

    return { filterQuery, sortQuery };
  }

  sortDirectionToNumber(dir: SortDirectionEnum) {
    if (dir === SortDirectionEnum.ASC) return 1;
    if (dir === SortDirectionEnum.DECS) return -1;
    return null;
  }
}
