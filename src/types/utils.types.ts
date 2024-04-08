import { Types } from 'mongoose';

export type WithBDId = {
  _id: Types.ObjectId;
};

export enum SortDirectionEnum {
  ASC = 'asc',
  DECS = 'desc',
}

export type SortQueryData<T> = {
  [key in keyof T]: 1 | -1;
};

export type FilterQueryParams<T> = {
  [key in keyof T]: string;
};

export type SortQueryParams<T> = {
  [key in keyof T]: SortDirectionEnum;
};

export type TableQueryParams<T> = {
  search: FilterQueryParams<T>;
  sort: SortQueryParams<T>;
};
