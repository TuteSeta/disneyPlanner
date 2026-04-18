import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DayType } from '../enums/day-type.enum';

export class UpdateTripDayDto {
  @IsOptional()
  @IsEnum(DayType)
  dayType?: DayType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  locationLabel?: string;

  @IsOptional()
  @IsString()
  passRecommendation?: string;
}
