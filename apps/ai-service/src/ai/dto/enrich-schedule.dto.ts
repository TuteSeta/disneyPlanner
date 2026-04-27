import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class EnrichScheduleDto {
  @IsInt()
  tripId: number;

  @IsInt()
  dayId: number;

  @IsEnum(['REST', 'SHOPPING'])
  dayType: 'REST' | 'SHOPPING';

  @IsEnum(['low', 'medium', 'high'])
  budget: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsString()
  locationLabel?: string;

  @IsInt()
  @IsOptional()
  maxTokens?: number;
}
