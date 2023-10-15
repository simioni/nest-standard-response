import { SetMetadata } from '@nestjs/common';
import {
  RESPONSE_FEATURES,
  STANDARD_RESPONSE_FEATURES_KEY,
} from '../standard-response.constants';

export const SetStandardResponseFeatures = (features: RESPONSE_FEATURES[]) =>
  SetMetadata(STANDARD_RESPONSE_FEATURES_KEY, features);
