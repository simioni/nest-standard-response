import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import { FilteredResponseOptions } from '../interfaces/filtered-response-options.interface';

export type FilteringQueryOperation = {
  field: string;
  operation: string;
  value: string;
};

export type FilteringQueryGroup = {
  anyOf?: FilteringQueryGroup[] | FilteringQueryOperation[];
  allOf?: FilteringQueryGroup[] | FilteringQueryOperation[];
};

export class FilteringInfoDto implements FilteredResponseOptions {
  @ApiPropertyOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional()
  @IsArray()
  filter?: FilteringQueryGroup;

  @ApiPropertyOptional()
  @IsArray()
  filterableFields?: string[];

  constructor(init?: Partial<FilteringInfoDto>) {
    Object.assign(this, init);
  }
}
