import { ExecutionContext, BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FilteringParams } from '../decorators/standard-param.decorator';
import {
  FilteringInfoDto,
  FilteringQueryOperation,
} from '../dto/filtering-info.dto';
import { FilteringQueryDto } from '../dto/filtering-query.dto';
import { FilteredResponseOptions } from '../interfaces/filtered-response-options.interface';
import { RESPONSE_FILTERING_INFO_KEY } from '../standard-response.constants';

export async function getFilteringInfo(
  ctx: ExecutionContext,
): Promise<FilteringParams> {
  const handler = ctx.getHandler();

  const filteringInfo = await validateFilteringQuery(ctx);

  Reflect.defineMetadata(RESPONSE_FILTERING_INFO_KEY, filteringInfo, handler);

  const filtering: FilteringParams = {
    filteringInfo: filteringInfo,
    setFilteringInfo: function (metadata) {
      const currentMetadata = Reflect.getMetadata(
        RESPONSE_FILTERING_INFO_KEY,
        handler,
      );
      const newMetadata = {
        ...currentMetadata,
        ...metadata,
      };
      Reflect.defineMetadata(RESPONSE_FILTERING_INFO_KEY, newMetadata, handler);
    },
  };
  return filtering;
}

const operandsRegex = new RegExp(
  `(?<operand><\=|<|>\=|>|==|!=|=@|!@|=\\^|=\\$|=~|!~)`,
);

export async function validateFilteringQuery(
  ctx: ExecutionContext,
): Promise<FilteringInfoDto> {
  const request = ctx.switchToHttp().getRequest();

  const filteringOptions: FilteredResponseOptions = Reflect.getMetadata(
    RESPONSE_FILTERING_INFO_KEY,
    ctx.getHandler(),
  );

  const filteringQuery = plainToInstance(FilteringQueryDto, {
    filter: request.query.filter,
  });
  const errors = await validate(filteringQuery);
  if (errors.length > 0) {
    throw new BadRequestException(
      errors.map((error) => {
        return {
          field: error.property,
          error: Object.values(error.constraints).join(', '),
        };
      }),
    );
  }

  const filteringInfo = new FilteringInfoDto(filteringOptions);
  if (!filteringQuery.filter) {
    return filteringInfo;
  }

  filteringInfo.query = filteringQuery.filter;

  // const operands = ['<', '<=', '>', '>=', '==', '!=', '=@', '!@', '=^', '=$'];

  const queryFilterFields = [];
  const filterGroups = filteringQuery.filter.split(';').map((filterGroup) => {
    return {
      anyOf: filterGroup.split(',').map((field): FilteringQueryOperation => {
        const result = field.match(operandsRegex);
        if (!result) {
          throw new BadRequestException({
            field: 'filter',
            error: `invalid filtering expression: ${field}`,
          });
        }
        // field: field.substring(0, result.index),
        return {
          field:
            queryFilterFields[
              queryFilterFields.push(field.substring(0, result.index)) - 1
            ],
          operation: result.groups.operand,
          value: field.substring(result.index + result.groups.operand.length),
        };
      }),
    };
  });

  filteringInfo.filter = {
    allOf: filterGroups,
  };

  const uniqueFilterFields = queryFilterFields.filter(
    (value, index, array) => array.indexOf(value) === index,
  );

  if (filteringOptions?.filterableFields) {
    const invalidFields = uniqueFilterFields.filter(
      (filter) => !filteringOptions.filterableFields.includes(filter),
    );
    if (invalidFields.length > 0) {
      throw new BadRequestException({
        field: 'sort',
        error: `invalid filtering field${
          invalidFields.length > 1 ? 's' : ''
        }: ${invalidFields.join(', ')}`,
      });
    }
  }

  return filteringInfo;
}
