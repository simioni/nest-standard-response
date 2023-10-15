import { ResponseModelType } from './standard-response-options.interface';

export interface RawResponseOptions<TModel = ResponseModelType> {
  type?: TModel;
  description?: string;
}
