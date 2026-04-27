import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class DayAssignmentDto {
  @IsInt()
  dayId: number;

  @IsEnum(['THEME_PARK', 'SHOPPING', 'REST', 'MIXED', 'SIGHTSEEING'])
  dayType: 'THEME_PARK' | 'SHOPPING' | 'REST' | 'MIXED' | 'SIGHTSEEING';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  parkId?: string;
}

export class SchedulePreferencesDto {
  @IsEnum(['relaxed', 'normal', 'aggressive'])
  intensity: 'relaxed' | 'normal' | 'aggressive';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  priorityAttractions?: string[];

  @IsOptional()
  @IsBoolean()
  hasKids?: boolean;

  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  budget?: 'low' | 'medium' | 'high';
}

export class GenerateScheduleDto {
  @IsInt()
  tripId: number;

  @IsString()
  @IsOptional()
  destinationSlug?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayAssignmentDto)
  days: DayAssignmentDto[];

  @ValidateNested()
  @Type(() => SchedulePreferencesDto)
  preferences: SchedulePreferencesDto;
}
