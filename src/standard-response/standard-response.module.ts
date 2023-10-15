import { DynamicModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { StandardResponseInterceptor } from './interceptors/standard-response.interceptor';
import { StandardResponseModuleOptions } from './interfaces/standard-response-module-options.interface';

@Module({})
export class StandardResponseModule {
  static forRoot(options?: StandardResponseModuleOptions): DynamicModule {
    return {
      module: StandardResponseModule,
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useFactory: (reflector: Reflector) => {
            return new StandardResponseInterceptor(reflector, options);
          },
          inject: [Reflector],
        },
      ],
      imports: [],
      exports: [],
    };
  }
}
