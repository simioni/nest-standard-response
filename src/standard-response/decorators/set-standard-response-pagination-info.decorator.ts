import { SetMetadata } from '@nestjs/common';
import { PaginationInfoDto } from '../dto/pagination-info.dto';
import { RESPONSE_PAGINATION_INFO_KEY } from '../standard-response.constants';

export const SetStandardResponsePaginationInfo = (
  obj: Partial<PaginationInfoDto>,
) => SetMetadata(RESPONSE_PAGINATION_INFO_KEY, obj);
