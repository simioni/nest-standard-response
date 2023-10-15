export enum RESPONSE_TYPE {
  STANDARD = 'standard',
  RAW = 'raw',
}

export enum RESPONSE_FEATURES {
  PAGINATION = 'pagination',
  SORTING = 'sorting',
  FILTERING = 'filtering',
}

export const STANDARD_RESPONSE_TYPE_KEY = 'standard_response_type';
export const STANDARD_RESPONSE_MESSAGE_KEY = 'standard_response_message';
export const STANDARD_RESPONSE_FEATURES_KEY = 'standard_response_features';

export const RESPONSE_PAGINATION_INFO_KEY = 'standard_response_pagination_info';
export const RESPONSE_SORTING_INFO_KEY = 'standard_response_sorting_info';
export const RESPONSE_FILTERING_INFO_KEY = 'standard_response_filtering_info';

export const DEFAULT_VALIDATION_ERROR_MESSAGE =
  'Validation failed for your return value. Did you accidentally return a document directly from your ORM instead of building a DTO or similar class? This can lead to potential data leaks.';
