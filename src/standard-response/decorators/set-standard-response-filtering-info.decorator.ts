import { SetMetadata } from '@nestjs/common';
import { FilteringInfoDto } from '../dto/filtering-info.dto';
import { RESPONSE_FILTERING_INFO_KEY } from '../standard-response.constants';

export const SetStandardResponseFilteringInfo = (
  obj: Partial<FilteringInfoDto>,
) => SetMetadata(RESPONSE_FILTERING_INFO_KEY, obj);
