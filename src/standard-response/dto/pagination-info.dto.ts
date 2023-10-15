import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString } from 'class-validator';
import { PaginatedResponseOptions } from '../interfaces/paginated-response-options.interface';

export class PaginationInfoDto implements PaginatedResponseOptions {
  @ApiPropertyOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional()
  @IsInt()
  count?: number;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  limit: number;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  offset: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsPositive()
  maxLimit?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsPositive()
  minLimit?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsPositive()
  defaultLimit?: number;

  constructor(init?: Partial<PaginationInfoDto>) {
    Object.assign(this, init);
  }
}
