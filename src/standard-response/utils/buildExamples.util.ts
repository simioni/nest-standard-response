/* eslint-disable @typescript-eslint/ban-types */
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { ModelPropertiesAccessor } from '@nestjs/swagger/dist/services/model-properties-accessor';
// import { ParametersMetadataMapper } from '@nestjs/swagger/dist/services/parameters-metadata-mapper';
// import { SchemaObjectFactory } from '@nestjs/swagger/dist/services/schema-object-factory';
import { SwaggerTypesMapper } from '@nestjs/swagger/dist/services/swagger-types-mapper';
import { isBuiltInType } from '@nestjs/swagger/dist/utils/is-built-in-type.util';
import { instanceToPlain } from 'class-transformer';
import { isFunction } from 'util';
import { StandardResponseDto } from '../dto/standard-response.dto';

// import { UserRole } from 'users/schemas/user.schema';
export enum UserRole {
  USER = 'User',
  MOD = 'Mod',
  ADMIN = 'Admin',
}

export function buildExampleForEveryRole(responseDataClass) {
  const examples = {};
  for (const [role, roleValue] of Object.entries(UserRole)) {
    examples[`${role}ResponseExample`] = {
      summary: `Response for role: ${roleValue}`,
      // value: new PaginatedResponseDto({
      value: new StandardResponseDto({
        pagination: {
          count: 30,
          limit: 10,
          offset: 0,
        },
        data: [getExampleForRole(responseDataClass, UserRole[role])],
      }),
    };
  }
  return examples;
}

const modelPropertiesAccessor = new ModelPropertiesAccessor();
// const parametersMetadataMapper = new ParametersMetadataMapper(
//   modelPropertiesAccessor,
// );
const swaggerTypesMapper = new SwaggerTypesMapper();
// const schemaObjectFactory: SchemaObjectFactory = new SchemaObjectFactory(
//   modelPropertiesAccessor,
//   swaggerTypesMapper,
// );

export function getExampleForRole<T>(
  model: new (...args: any[]) => T,
  role: UserRole,
) {
  // console.log(DefinitionsFactory.createForClass(model))

  // const meta = exploreApiResponseMetadata(model, instance, model.prototype, method)
  // const schemas: Record<string, SchemaObject> = {};
  // exploreApiResponseMetadata.bind(null, schemas)

  // const explicitParameters: any[] = Reflect.getMetadata(
  //   DECORATORS.API_PARAMETERS,
  //   method
  // );
  // const globalParameters = GlobalParametersStorage.getAll();
  // const parametersMetadata = parameterMetadataAccessor.explore(
  //   instance,
  //   prototype,
  //   method
  // );
  // const noExplicitAndGlobalMetadata =
  //   isNil(explicitParameters) && isNil(globalParameters);
  // if (noExplicitAndGlobalMetadata && isNil(parametersMetadata)) {
  //   return undefined;
  // }

  // const reflectedParametersAsProperties =
  //   parametersMetadataMapper.transformModelToProperties(
  //     parametersMetadata || {}
  //   );

  // let properties = reflectedParametersAsProperties;
  // if (!noExplicitAndGlobalMetadata) {
  //   const mergeImplicitAndExplicit = (item: ParamWithTypeMetadata) =>
  //     assign(item, find(explicitParameters, ['name', item.name]));

  //   properties = removeBodyMetadataIfExplicitExists(
  //     properties,
  //     explicitParameters
  //   );
  //   properties = map(properties, mergeImplicitAndExplicit);
  //   properties = unionWith(
  //     properties,
  //     explicitParameters,
  //     globalParameters,
  //     (arrVal, othVal) => {
  //       return arrVal.name === othVal.name && arrVal.in === othVal.in;
  //     }
  //   );

  // const paramsWithDefinitions = schemaObjectFactory.createFromModel(
  //   properties,
  //   schemas
  // );
  // const parameters = swaggerTypesMapper.mapParamTypes(paramsWithDefinitions);
  // console.log(parameters);
  // return parameters ? { parameters } : undefined;

  // const keys = Reflect.getMetadataKeys(model.prototype)
  // console.log(keys)

  // const modelApiProperties =
  // Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES_ARRAY, model.prototype) || [];
  // console.log(modelApiProperties)

  const modelApiPropertiesArray = modelPropertiesAccessor.getModelProperties(
    model.prototype,
  );

  const fullExample = {};
  for (const property of modelApiPropertiesArray) {
    const value = Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES,
      model.prototype,
      property,
    );
    const type = value.type;
    const isArray = value.isArray;
    const arrayItemType = value.items?.type;
    let swaggerType;

    // console.log(property, value);

    if (isBuiltInType(type as Function)) {
      const typeName =
        type && isFunction(type) ? (type as Function).name : (type as string);
      swaggerType = swaggerTypesMapper.mapTypeToOpenAPIType(typeName);
    } else {
      swaggerType =
        type && isFunction(type) ? (type as Function).name : (type as string);
      // const name = schemaObjectFactory.exploreModelSchema(
      //   type as Function,
      //   schemas
      // );
    }

    if (isArray && arrayItemType) {
      const itemType =
        value.items.type && isFunction(value.items.type)
          ? (value.items.type as Function).name
          : (value.items.type as string);
      swaggerType = `[${swaggerTypesMapper.mapTypeToOpenAPIType(itemType)}]`;
    }

    fullExample[property] = Object.hasOwn(value, 'example')
      ? value.example
      : swaggerType;
  }

  const instance = new model(fullExample);
  const transformed = instanceToPlain(instance, { groups: [role] });
  return transformed;
}
