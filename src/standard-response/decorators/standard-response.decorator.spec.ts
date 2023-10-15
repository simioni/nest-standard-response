import { createMock, PartialFuncReturn } from '@golevelup/ts-jest';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import { StandardResponseInterceptor } from '../interceptors/standard-response.interceptor';
import { StandardResponseOptions } from '../interfaces/standard-response-options.interface';
import { StandardResponse } from './standard-response.decorator';

describe('StandardResponseDecorator', () => {
  let interceptor: StandardResponseInterceptor;
  let reflector: Reflector;
  let context: ExecutionContext;
  let handler: CallHandler;
  let handlerArray: CallHandler;
  let testPayload;
  let testPayloadArray;

  function getContext(payload, decoratorOptions?: StandardResponseOptions) {
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
    });
  }

  beforeEach(async () => {
    reflector = new Reflector();
    interceptor = new StandardResponseInterceptor(reflector);
    testPayload = {
      id: '1234',
      name: 'mark',
    };
    testPayloadArray = [
      { name: 'mark' },
      { name: 'charlie' },
      { name: 'carol' },
      { name: 'josh' },
    ];
    handler = createMock<CallHandler>({
      handle: () => of(testPayload),
    });
    handlerArray = createMock<CallHandler>({
      handle: () => of(testPayloadArray),
    });
  });

  it('should be defined', () => {
    expect(reflector).toBeDefined();
    expect(interceptor).toBeDefined();
    expect(handler.handle).toBeDefined();
    expect(testPayload).toBeDefined();
    expect(Object.hasOwn(testPayload, 'name')).toEqual(true);
    expect(Array.isArray(testPayloadArray)).toEqual(true);
    expect(testPayloadArray.length).toEqual(4);
  });

  it('should support returning individual objects', async () => {
    context = getContext(testPayload);
    const userObservable = interceptor.intercept(context, handler);
    const response = await lastValueFrom(userObservable);
    expect(response.success).toEqual(true);
    expect(response.isArray).toBeUndefined();
    expect(response.data.name).toEqual(testPayload.name);
  });

  it('should support returning arrays of objects', async () => {
    context = getContext(testPayloadArray);
    const userObservable = interceptor.intercept(context, handlerArray);
    const response = await lastValueFrom(userObservable);
    expect(response.success).toEqual(true);
    expect(response.isArray).toEqual(true);
    expect(response.data.length).toEqual(4);
    expect(response.data[2].name).toEqual(testPayloadArray[2].name);
  });

  it("should support paginated responses and it's options", async () => {
    context = getContext(testPayloadArray, {
      isPaginated: true,
      minLimit: 4,
      maxLimit: 22,
      defaultLimit: 11,
    });
    interceptor = new StandardResponseInterceptor(reflector);
    const userObservable = interceptor.intercept(context, handlerArray);
    const response = await lastValueFrom(userObservable);
    expect(response.success).toEqual(true);
    expect(response.isArray).toEqual(true);
    expect(response.isPaginated).toEqual(true);
    expect(response.pagination).toBeDefined();
    expect(response.pagination.minLimit).toEqual(4);
    expect(response.pagination.maxLimit).toEqual(22);
    expect(response.pagination.defaultLimit).toEqual(11);
    expect(response.data.length).toEqual(4);
    expect(response.data[3].name).toEqual(testPayloadArray[3].name);
  });

  it("should support sorted responses and it's options", async () => {
    context = getContext(testPayloadArray, {
      isSorted: true,
      sortableFields: ['title', 'author', 'country'],
    });
    interceptor = new StandardResponseInterceptor(reflector);
    const userObservable = interceptor.intercept(context, handlerArray);
    const response = await lastValueFrom(userObservable);
    expect(response.success).toEqual(true);
    expect(response.isArray).toEqual(true);
    expect(response.isSorted).toEqual(true);
    expect(response.sorting).toBeDefined();
    expect(response.sorting.sortableFields).toBeDefined();
    expect(response.sorting.sortableFields.length).toEqual(3);
    expect(response.sorting.sortableFields[1]).toEqual('author');
    expect(response.data.length).toEqual(4);
    expect(response.data[3].name).toEqual(testPayloadArray[3].name);
  });

  it("should support filtered responses and it's options", async () => {
    context = getContext(testPayloadArray, {
      isFiltered: true,
      filterableFields: ['author', 'year'],
    });
    interceptor = new StandardResponseInterceptor(reflector);
    const userObservable = interceptor.intercept(context, handlerArray);
    const response = await lastValueFrom(userObservable);
    expect(response.success).toEqual(true);
    expect(response.isArray).toEqual(true);
    expect(response.isFiltered).toEqual(true);
    expect(response.filtering).toBeDefined();
    expect(response.filtering.filterableFields).toBeDefined();
    expect(response.filtering.filterableFields.length).toEqual(2);
    expect(response.filtering.filterableFields[1]).toEqual('year');
    expect(response.data.length).toEqual(4);
    expect(response.data[3].name).toEqual(testPayloadArray[3].name);
  });

  it('should support combined features and all their options', async () => {
    context = getContext(testPayloadArray, {
      isPaginated: true,
      minLimit: 4,
      maxLimit: 22,
      defaultLimit: 11,
      isSorted: true,
      sortableFields: ['title', 'author', 'country'],
      isFiltered: true,
      filterableFields: ['author', 'year'],
    });
    interceptor = new StandardResponseInterceptor(reflector);
    const userObservable = interceptor.intercept(context, handlerArray);
    const response = await lastValueFrom(userObservable);
    expect(response.success).toEqual(true);
    expect(response.isArray).toEqual(true);

    expect(response.isPaginated).toEqual(true);
    expect(response.pagination).toBeDefined();
    expect(response.pagination.minLimit).toEqual(4);
    expect(response.pagination.maxLimit).toEqual(22);
    expect(response.pagination.defaultLimit).toEqual(11);

    expect(response.isSorted).toEqual(true);
    expect(response.sorting).toBeDefined();
    expect(response.sorting.sortableFields).toBeDefined();
    expect(response.sorting.sortableFields.length).toEqual(3);
    expect(response.sorting.sortableFields[1]).toEqual('author');

    expect(response.isFiltered).toEqual(true);
    expect(response.filtering).toBeDefined();
    expect(response.filtering.filterableFields).toBeDefined();
    expect(response.filtering.filterableFields.length).toEqual(2);
    expect(response.filtering.filterableFields[1]).toEqual('year');

    expect(response.data.length).toEqual(4);
    expect(response.data[3].name).toEqual(testPayloadArray[3].name);
  });
});
