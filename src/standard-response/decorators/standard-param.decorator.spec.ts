/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/ban-types */
import { createMock, PartialFuncReturn } from '@golevelup/ts-jest';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import { SortingOrder } from '../dto/sorting-info.dto';
import { StandardResponseInterceptor } from '../interceptors/standard-response.interceptor';
import { StandardResponseOptions } from '../interfaces/standard-response-options.interface';
import { StandardParam, StandardParams } from './standard-param.decorator';
import { StandardResponse } from './standard-response.decorator';

describe('StandardParamDecorator', () => {
  let interceptor: StandardResponseInterceptor;
  let reflector: Reflector;
  let context: ExecutionContext;
  let handler: CallHandler;
  let testPayload;

  function getContext(
    payload,
    decoratorOptions?: StandardResponseOptions,
    reqQuery = {},
  ) {
    class Test {
      @StandardResponse({ type: payload, ...decoratorOptions })
      public handler(): typeof payload {
        return payload;
      }
    }
    const classInstance = new Test();
    return createMock<ExecutionContext>({
      getClass: () => Test,
      getHandler: (): PartialFuncReturn<() => any> => classInstance.handler,
      switchToHttp: () => ({
        getRequest: () => ({
          query: reqQuery,
        }),
      }),
    });
  }

  /**
   * Retrieves the factory used by NestJS to inject the param into the route handler. This factory
   * is called every time a request comes in, and has access to the ExecutionContext in order to
   * generate the value that the param should have inside the handler.
   */
  function getParamDecoratorFactory(
    paramDecorator: Function,
  ): (data: any, context: ExecutionContext) => StandardParams {
    class Test {
      public handler(@paramDecorator() value) {}
    }
    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'handler');
    return args[Object.keys(args)[0]].factory;
  }

  beforeEach(async () => {
    reflector = new Reflector();
    interceptor = new StandardResponseInterceptor(reflector);
    context = createMock<ExecutionContext>();
    testPayload = [
      { name: 'mark' },
      { name: 'charlie' },
      { name: 'carol' },
      { name: 'josh' },
    ];
    handler = createMock<CallHandler>({
      handle: () => of(testPayload),
    });
  });

  it('should inject the params object in the request', async () => {
    context = getContext(testPayload, { isPaginated: true });
    const paramFactory = getParamDecoratorFactory(StandardParam);
    const param: StandardParams = await paramFactory(null, context);
    expect(param).toBeDefined();
    expect(param.setPaginationInfo).toBeDefined();
    param.setPaginationInfo({ count: 330 });
    const userObservable = interceptor.intercept(context, handler);
    const response = await lastValueFrom(userObservable);
    // console.log(response);
    expect(response.success).toEqual(true);
    expect(response.isArray).toEqual(true);
    expect(response.pagination).toBeDefined();
    expect(response.pagination.count).toEqual(330);
    expect(response.data.length).toEqual(4);
    expect(response.data[2].name).toEqual(testPayload[2].name);
  });

  it('should support basic params without any options set', async () => {
    context = getContext(testPayload, {
      isPaginated: true,
      isSorted: true,
      isFiltered: true,
    });
    const paramFactory = getParamDecoratorFactory(StandardParam);
    const param: StandardParams = await paramFactory(null, context);
    expect(param).toBeDefined();
    expect(param.setPaginationInfo).toBeDefined();
    expect(param.setSortingInfo).toBeDefined();
    expect(param.setFilteringInfo).toBeDefined();

    param.setPaginationInfo({ count: 40 });

    const userObservable = interceptor.intercept(context, handler);
    const response = await lastValueFrom(userObservable);
    expect(response.success).toEqual(true);
    expect(response.isArray).toEqual(true);
    expect(response.data.length).toEqual(4);
    expect(response.data[3].name).toEqual(testPayload[3].name);

    // PAGINATION - from decorator options
    expect(response.isPaginated).toEqual(true);
    expect(response.pagination).toBeDefined();
    expect(response.pagination.defaultLimit).toBeDefined();
    expect(response.pagination.limit).toEqual(response.pagination.defaultLimit);
    expect(response.pagination.offset).toBeDefined();
    expect(response.isSorted).toEqual(true);
    expect(response.sorting).toBeDefined();
    expect(response.isFiltered).toEqual(true);
    expect(response.filtering).toBeDefined();
  });

  it('should support fully featured params with all options set', async () => {
    context = getContext(
      testPayload,
      {
        isPaginated: true,
        minLimit: 4,
        maxLimit: 22,
        defaultLimit: 12,
        isSorted: true,
        sortableFields: ['title', 'author', 'country', 'year'],
        isFiltered: true,
        filterableFields: ['author', 'year'],
      },
      {
        limit: '8',
        offset: '16',
        sort: 'title,-year',
        filter: 'author==John,author==Jake;year>=1890,year<=2000',
      },
    );
    const paramFactory = getParamDecoratorFactory(StandardParam);
    const param: StandardParams = await paramFactory(null, context);
    expect(param).toBeDefined();
    expect(param.setPaginationInfo).toBeDefined();
    expect(param.setSortingInfo).toBeDefined();
    expect(param.setFilteringInfo).toBeDefined();
    param.setPaginationInfo({ count: 340 });
    param.setMessage('This response includes all features');

    const userObservable = interceptor.intercept(context, handler);
    const response = await lastValueFrom(userObservable);

    // console.log(response);
    expect(response.success).toEqual(true);
    expect(response.message).toEqual('This response includes all features');
    expect(response.isArray).toEqual(true);
    expect(response.data.length).toEqual(4);
    expect(response.data[3].name).toEqual(testPayload[3].name);

    // PAGINATION - from decorator options
    expect(response.isPaginated).toEqual(true);
    expect(response.pagination).toBeDefined();
    expect(response.pagination.minLimit).toEqual(4);
    expect(response.pagination.maxLimit).toEqual(22);
    expect(response.pagination.defaultLimit).toEqual(12);

    // PAGINATION - from user query
    expect(response.pagination.query).toEqual('limit=8&offset=16');
    expect(response.pagination.limit).toEqual(8);
    expect(response.pagination.offset).toEqual(16);

    // PAGINATION - from handler body
    expect(response.pagination.count).toEqual(340);

    // SORTING - from decorator options
    expect(response.isSorted).toEqual(true);
    expect(response.sorting).toBeDefined();
    expect(response.sorting.sortableFields).toBeDefined();
    expect(response.sorting.sortableFields.length).toEqual(4);
    expect(response.sorting.sortableFields[1]).toEqual('author');

    // SORTING - from user query
    expect(response.sorting.query).toEqual('title,-year');
    expect(Array.isArray(response.sorting.sort)).toEqual(true);
    expect(response.sorting.sort.length).toEqual(2);
    expect(response.sorting.sort[0].field).toEqual('title');
    expect(response.sorting.sort[0].order).toEqual(SortingOrder.ASC);
    expect(response.sorting.sort[1].field).toEqual('year');
    expect(response.sorting.sort[1].order).toEqual(SortingOrder.DES);

    // FILTERING - from decorator options
    expect(response.isFiltered).toEqual(true);
    expect(response.isFiltered).toBeDefined();
    expect(response.filtering.filterableFields).toBeDefined();
    expect(response.filtering.filterableFields.length).toEqual(2);
    expect(response.filtering.filterableFields[1]).toEqual('year');

    // FILTERING - from user query
    expect(response.filtering.query).toEqual(
      'author==John,author==Jake;year>=1890,year<=2000',
    );
    expect(Array.isArray(response.filtering.filter.allOf)).toEqual(true);
    expect(response.filtering.filter.allOf.length).toEqual(2);
    // filter 1
    expect(response.filtering.filter.allOf[0].anyOf[0].field).toEqual('author');
    expect(response.filtering.filter.allOf[0].anyOf[0].operation).toEqual('==');
    expect(response.filtering.filter.allOf[0].anyOf[0].value).toEqual('John');
    expect(response.filtering.filter.allOf[0].anyOf[1].field).toEqual('author');
    expect(response.filtering.filter.allOf[0].anyOf[1].operation).toEqual('==');
    expect(response.filtering.filter.allOf[0].anyOf[1].value).toEqual('Jake');
    // filter 2
    expect(response.filtering.filter.allOf[1].anyOf[0].field).toEqual('year');
    expect(response.filtering.filter.allOf[1].anyOf[0].operation).toEqual('>=');
    expect(response.filtering.filter.allOf[1].anyOf[0].value).toEqual('1890');
    expect(response.filtering.filter.allOf[1].anyOf[1].field).toEqual('year');
    expect(response.filtering.filter.allOf[1].anyOf[1].operation).toEqual('<=');
    expect(response.filtering.filter.allOf[1].anyOf[1].value).toEqual('2000');
  });
});
