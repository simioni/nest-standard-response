/* eslint-disable @typescript-eslint/ban-types */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  Optional,
  Type,
  BadGatewayException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { StandardResponseDto } from '../dto/standard-response.dto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginationInfoDto } from '../dto/pagination-info.dto';
import {
  STANDARD_RESPONSE_TYPE_KEY,
  STANDARD_RESPONSE_FEATURES_KEY,
  RESPONSE_PAGINATION_INFO_KEY,
  RESPONSE_TYPE,
  RESPONSE_FEATURES,
  RESPONSE_SORTING_INFO_KEY,
  RESPONSE_FILTERING_INFO_KEY,
  DEFAULT_VALIDATION_ERROR_MESSAGE,
  STANDARD_RESPONSE_MESSAGE_KEY,
} from '../standard-response.constants';
import { SortingInfoDto } from '../dto/sorting-info.dto';
import { FilteringInfoDto } from '../dto/filtering-info.dto';
import { StandardResponseModuleOptions } from '../interfaces/standard-response-module-options.interface';

const defaultOptions: StandardResponseModuleOptions = {
  interceptAll: true,
  validationErrorMessage: DEFAULT_VALIDATION_ERROR_MESSAGE,
};

@Injectable()
export class StandardResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(StandardResponseInterceptor.name);
  private responseType: RESPONSE_TYPE;
  private responseFeatures: RESPONSE_FEATURES[];
  private routeController: Type<any>;
  private routeHandler: Function;

  constructor(
    private reflector: Reflector,
    @Optional()
    protected readonly options: StandardResponseModuleOptions = {},
  ) {
    this.options = { ...defaultOptions, ...options };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    this.routeController = context.getClass();
    this.routeHandler = context.getHandler();

    this.responseType = this.reflector.getAllAndOverride(
      STANDARD_RESPONSE_TYPE_KEY,
      [this.routeHandler, this.routeController],
    );

    if (!this.responseType && !this.options.interceptAll) {
      return next.handle();
    }

    this.responseFeatures =
      this.reflector.getAllAndMerge(STANDARD_RESPONSE_FEATURES_KEY, [
        this.routeHandler,
        this.routeController,
      ]) ?? [];

    return next.handle().pipe(
      map((data) => {
        if (data instanceof HttpException) {
          return data;
        }
        if (!this.isValidResponse(data)) {
          return new BadGatewayException();
        }
        return this.transformResponse(data);
      }),
    );
  }

  isValidResponse(data) {
    if (typeof data === 'undefined') return false;
    if (typeof this.options.validateResponse === 'undefined') return true;
    if (typeof this.options.validateResponse !== 'function') return false;
    const isArray = Array.isArray(data);
    if (isArray) {
      if (data.some((value) => !this.options.validateResponse(value))) {
        this.logger.error(this.options.validationErrorMessage);
        return false;
      }
    }
    if (!isArray && !this.options.validateResponse(data)) {
      this.logger.error(this.options.validationErrorMessage);
      return false;
    }
    return true;
  }

  transformResponse(data) {
    let transformFunction;

    if (this.responseType === RESPONSE_TYPE.RAW) {
      transformFunction = (data) => data;
      return transformFunction(data);
    }

    const responseFields: Partial<StandardResponseDto<typeof data>> = {};

    responseFields.message = this.reflector.get<string>(
      STANDARD_RESPONSE_MESSAGE_KEY,
      this.routeHandler,
    );

    if (this.responseFeatures.includes(RESPONSE_FEATURES.PAGINATION)) {
      const paginationInfo = this.reflector.get<PaginationInfoDto>(
        RESPONSE_PAGINATION_INFO_KEY,
        this.routeHandler,
      );
      responseFields.pagination = paginationInfo;
    }

    if (this.responseFeatures.includes(RESPONSE_FEATURES.SORTING)) {
      const sortingInfo = this.reflector.get<SortingInfoDto>(
        RESPONSE_SORTING_INFO_KEY,
        this.routeHandler,
      );
      responseFields.sorting = sortingInfo;
    }

    if (this.responseFeatures.includes(RESPONSE_FEATURES.FILTERING)) {
      const filteringInfo = this.reflector.get<FilteringInfoDto>(
        RESPONSE_FILTERING_INFO_KEY,
        this.routeHandler,
      );
      responseFields.filtering = filteringInfo;
    }

    transformFunction = (data) =>
      new StandardResponseDto({ ...responseFields, data });

    return transformFunction(data);
  }
}
