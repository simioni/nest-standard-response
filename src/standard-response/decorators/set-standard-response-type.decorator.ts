import { SetMetadata } from '@nestjs/common';
import {
  RESPONSE_TYPE,
  STANDARD_RESPONSE_TYPE_KEY,
} from '../standard-response.constants';

export const SetStandardResponseType = (type: RESPONSE_TYPE) =>
  SetMetadata(STANDARD_RESPONSE_TYPE_KEY, type);
