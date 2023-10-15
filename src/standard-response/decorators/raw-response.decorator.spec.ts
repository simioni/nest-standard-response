import { createMock, PartialFuncReturn } from '@golevelup/ts-jest';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import { StandardResponseInterceptor } from '../interceptors/standard-response.interceptor';
import { StandardResponseOptions } from '../interfaces/standard-response-options.interface';
import { RawResponse } from './raw-response.decorator';
import { StandardResponse } from './standard-response.decorator';

describe('StandardResponseDecorator', () => {
  let interceptor: StandardResponseInterceptor;
  let reflector: Reflector;
  let context: ExecutionContext;
  let handlerArray: CallHandler;
  let testPayloadArray;

  function getStandardContext(
    payload,
    decoratorOptions?: StandardResponseOptions,
  ) {
    class TestStandard {
      @StandardResponse({ type: payload, ...decoratorOptions })
      public handler(): typeof payload {
        return payload;
      }
    }
    const classInstance = new TestStandard();
    return createMock<ExecutionContext>({
      getClass: () => TestStandard,
      getHandler: (): PartialFuncReturn<() => any> => classInstance.handler,
    });
  }

  function getRawContext(payload, decoratorOptions?: StandardResponseOptions) {
    class TestRaw {
      @RawResponse(decoratorOptions)
      public handler(): typeof payload {
        return payload;
      }
    }
    const classInstance = new TestRaw();
    return createMock<ExecutionContext>({
      getClass: () => TestRaw,
      getHandler: (): PartialFuncReturn<() => any> => classInstance.handler,
    });
  }

  beforeEach(async () => {
    reflector = new Reflector();
    interceptor = new StandardResponseInterceptor(reflector);
    testPayloadArray = [
      { name: 'mark' },
      { name: 'charlie' },
      { name: 'carol' },
      { name: 'josh' },
    ];
    handlerArray = createMock<CallHandler>({
      handle: () => of(testPayloadArray),
    });
  });

  it('should be defined', () => {
    expect(reflector).toBeDefined();
    expect(interceptor).toBeDefined();
    expect(handlerArray.handle).toBeDefined();
    expect(testPayloadArray).toBeDefined();
    expect(Array.isArray(testPayloadArray)).toEqual(true);
    expect(testPayloadArray.length).toEqual(4);
  });

  it('should confirm that the interceptor is wrapping ALL responses, including unannotated ones (this is the default behavior)', async () => {
    context = getStandardContext(testPayloadArray);
    interceptor = new StandardResponseInterceptor(reflector);
    const userObservable = interceptor.intercept(context, handlerArray);
    const response = await lastValueFrom(userObservable);
    expect(response.success).toEqual(true);
    expect(response.data[1].name).toEqual(testPayloadArray[1].name);
  });

  it('should SKIP wrapping responses for routes annotated with @RawResponse()', async () => {
    context = getRawContext(testPayloadArray);
    const userObservable = interceptor.intercept(context, handlerArray);
    const response = await lastValueFrom(userObservable);
    expect(response.success).toBeUndefined();
    expect(response.isArray).toBeUndefined();
    expect(response.data).toBeUndefined();
    expect(Array.isArray(response)).toEqual(true);
    expect(response[2].name).toEqual(testPayloadArray[2].name);
  });

  it('should optionally accept basic documentation', async () => {
    context = getRawContext(testPayloadArray, {
      type: testPayloadArray,
      description: 'Basic doc fields for openApi',
    });
    const userObservable = interceptor.intercept(context, handlerArray);
    const response = await lastValueFrom(userObservable);
    expect(response[2].name).toEqual(testPayloadArray[2].name);
  });
});
