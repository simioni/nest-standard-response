/* eslint-disable @typescript-eslint/no-unused-vars */
import { applyDecorators, SetMetadata } from '@nestjs/common';
import { RESPONSE_TYPE } from '../standard-response.constants';
import { RawResponseOptions } from '../interfaces/raw-response-options.interface';
import {
  AnyClass,
  ResponseModelType,
} from '../interfaces/standard-response-options.interface';
import { SetStandardResponseType } from './set-standard-response-type.decorator';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export function RawResponse<TModel extends ResponseModelType>({
  type,
  description,
}: RawResponseOptions<TModel> = {}) {
  const decoratorsToApply: (
    | MethodDecorator
    | ClassDecorator
    | PropertyDecorator
  )[] = [SetStandardResponseType(RESPONSE_TYPE.RAW)];

  if (typeof type === 'undefined') {
    return applyDecorators(...decoratorsToApply);
  }

  const returnType: AnyClass | string = Array.isArray(type) ? type[0] : type;

  const dataArraySchema = {
    type: 'array',
    items: {
      ...(typeof returnType === 'string'
        ? { type: 'string' }
        : { $ref: getSchemaPath(returnType) }),
    },
  };
  const dataObjSchema = {
    ...(typeof returnType === 'string'
      ? { type: 'string' }
      : { $ref: getSchemaPath(returnType) }),
  };

  if (typeof returnType === 'function') {
    decoratorsToApply.push(ApiExtraModels(returnType));
  }

  decoratorsToApply.push(
    ApiOkResponse({
      description: description,
      content: {
        'application/json': {
          schema: Array.isArray(type) ? dataArraySchema : dataObjSchema,
        },
      },
    }),
  );

  return applyDecorators(...decoratorsToApply);
}
