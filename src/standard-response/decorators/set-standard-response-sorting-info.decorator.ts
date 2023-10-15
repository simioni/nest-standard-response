import { SetMetadata } from '@nestjs/common';
import { SortingInfoDto } from '../dto/sorting-info.dto';
import { RESPONSE_SORTING_INFO_KEY } from '../standard-response.constants';

export const SetStandardResponseSortingInfo = (obj: Partial<SortingInfoDto>) =>
  SetMetadata(RESPONSE_SORTING_INFO_KEY, obj);
