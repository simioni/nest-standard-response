import { PaginatedResponseOptions } from "./paginated-response-options.interface";
import { SortedResponseOptions } from "./sorted-response-options.interface";
import { FilteredResponseOptions } from "./filtered-response-options.interface";
import { Type } from "@nestjs/common";

// export type AnyClass = new (...arg) => any;
export type AnyClass = Type<unknown>;
export type ClassOrClassArray = AnyClass | [className: AnyClass];
export type ResponseModelType = ClassOrClassArray | string | [string];

export interface StandardResponseOptions<TModel = ResponseModelType>
  extends PaginatedResponseOptions,
    SortedResponseOptions,
    FilteredResponseOptions {
  type?: TModel;
  status?: number | "default" | "1XX" | "2XX" | "3XX" | "4XX" | "5XX";
  description?: string;
  isPaginated?: boolean;
  isSorted?: boolean;
  isFiltered?: boolean;
}
