import { IsOptional, IsString } from 'class-validator';

export class SortingQueryDto {
  @IsString()
  @IsOptional()
  sort?: string;
}
