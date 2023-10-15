import { IsInt, IsPositive, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsInt()
  @IsPositive()
  limit: number;

  @IsInt()
  @Min(0)
  offset: number;
}
