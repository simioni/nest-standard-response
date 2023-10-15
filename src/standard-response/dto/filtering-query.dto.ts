import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilteringQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  filter?: string;
}
