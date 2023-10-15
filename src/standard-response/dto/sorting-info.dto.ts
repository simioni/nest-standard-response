import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import { SortedResponseOptions } from '../interfaces/sorted-response-options.interface';

export enum SortingOrder {
  ASC = 'asc',
  DES = 'des',
}

export type SortingOperation = {
  field: string;
  order: SortingOrder;
};

export class SortingInfoDto implements SortedResponseOptions {
  @ApiPropertyOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional()
  @IsArray()
  sort?: SortingOperation[];

  @ApiPropertyOptional()
  @IsArray()
  sortableFields?: string[];

  constructor(init?: Partial<SortingInfoDto>) {
    Object.assign(this, init);
  }
}
