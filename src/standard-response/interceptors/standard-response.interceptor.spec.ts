import { createMock } from '@golevelup/ts-jest';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import { StandardResponseInterceptor } from './standard-response.interceptor';

describe('StandardResponseInterceptor', () => {
  let interceptor: StandardResponseInterceptor;
  let reflector: Reflector;
  let context: ExecutionContext;
  let handler: CallHandler;
  const testPayload = {
    id: '1234',
    name: 'mark',
  };

  // let appController: AppController;
  // let appService: AppService;

  // const executionContext = {
  //   switchToHttp: jest.fn().mockReturnThis(),
  //   getRequest: jest.fn().mockReturnThis(),
  // };

  beforeEach(async () => {
    reflector = new Reflector();
    context = createMock<ExecutionContext>();
    handler = createMock<CallHandler>({
      handle: () => of(testPayload),
    });
    // const moduleRef = await Test.createTestingModule({
    //   controllers: [AppController],
    //   providers: [AppService],
    // }).compile();
    // appService = moduleRef.get<AppService>(AppService);
    // appController = moduleRef.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(reflector).toBeDefined();
    expect(context).toBeDefined();
    expect(handler.handle).toBeDefined();
  });

  it('should wrap ALL responses (including unannotated routes) by default', async () => {
    interceptor = new StandardResponseInterceptor(reflector);
    const userObservable = interceptor.intercept(context, handler);
    const response = await lastValueFrom(userObservable);
    expect(response.success).toEqual(true);
    expect(response.data.name).toEqual(testPayload.name);
  });

  it('should SKIP wrapping responses for unannotated routes when options.interceptAll = false', async () => {
    interceptor = new StandardResponseInterceptor(reflector, {
      interceptAll: false,
    });
    const userObservable = interceptor.intercept(context, handler);
    const response = await lastValueFrom(userObservable);
    expect(response.success).toBeUndefined();
    expect(response.data).toBeUndefined();
    expect(response.name).toEqual(testPayload.name);
  });

  it('should PREVENT responses that fail to pass options.validateResponse', async () => {
    interceptor = new StandardResponseInterceptor(reflector, {
      validateResponse: function shouldNotHaveId(data) {
        if (typeof data.id !== 'undefined') return false;
        return true;
      },
      validationErrorMessage:
        'This request will ERROR on purpose to test the validator.',
    });
    const userObservable = interceptor.intercept(context, handler);
    const response = await lastValueFrom(userObservable);
    expect(response.status).toEqual(502);
    expect(response.data).toBeUndefined();
  });

  it('should ALLOW responses that pass options.validateResponse', async () => {
    interceptor = new StandardResponseInterceptor(reflector, {
      validateResponse: function shouldHaveIdButNotAge(data) {
        if (typeof data.id === 'undefined') return false;
        if (typeof data.age !== 'undefined') return false;
        return true;
      },
    });
    const userObservable = interceptor.intercept(context, handler);
    const response = await lastValueFrom(userObservable);
    expect(response.success).toEqual(true);
    expect(response.data.id).toEqual(testPayload.id);
  });
});
