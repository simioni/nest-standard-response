import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PaginationInfoDto } from '../dto/pagination-info.dto';
import { FilteringInfoDto } from '../dto/filtering-info.dto';
import { SortingInfoDto } from '../dto/sorting-info.dto';
import { getFilteringInfo } from '../utils/getFilteringInfo.util';
import { getPaginationInfo } from '../utils/getPaginationInfo.util';
import { getSortingInfo } from '../utils/getSortingInfo.util';
import { STANDARD_RESPONSE_MESSAGE_KEY } from '../standard-response.constants';

type SettablePaginationInfo = Pick<
  PaginationInfoDto,
  'count' | 'limit' | 'offset'
>;
type SettableSortingInfo = Pick<SortingInfoDto, 'sort'>;
type SettableFilteringInfo = Pick<FilteringInfoDto, 'filter'>;
export interface PaginationParams {
  paginationInfo: PaginationInfoDto;
  setPaginationInfo: (metadata: Partial<SettablePaginationInfo>) => void;
}
export interface SortingParams {
  sortingInfo: SortingInfoDto;
  setSortingInfo: (metadata: Partial<SettableSortingInfo>) => void;
}
export interface FilteringParams {
  filteringInfo: FilteringInfoDto;
  setFilteringInfo: (metadata: Partial<SettableFilteringInfo>) => void;
}
export interface StandardParams
  extends PaginationParams,
    SortingParams,
    FilteringParams {
  setMessage?: (message: string) => void;
}

export const StandardParam = createParamDecorator(
  async (data: string, ctx: ExecutionContext) => {
    const handler = ctx.getHandler();
    // reset message metadata that might have been set on previous requests
    Reflect.defineMetadata(STANDARD_RESPONSE_MESSAGE_KEY, undefined, handler);

    const pagination = await getPaginationInfo(ctx);
    const sorting = await getSortingInfo(ctx);
    const filtering = await getFilteringInfo(ctx);
    const params: StandardParams = {
      ...pagination,
      ...sorting,
      ...filtering,
      setMessage: (message) => {
        Reflect.defineMetadata(STANDARD_RESPONSE_MESSAGE_KEY, message, handler);
      },
    };
    return params;
  },
);
