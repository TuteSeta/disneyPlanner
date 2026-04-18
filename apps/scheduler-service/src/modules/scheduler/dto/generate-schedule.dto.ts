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

  @IsEnum(['DISNEY', 'UNIVERSAL', 'REST', 'SHOPPING'])
  dayType: 'DISNEY' | 'UNIVERSAL' | 'REST' | 'SHOPPING';

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
}

export class GenerateScheduleDto {
  @IsInt()
  tripId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayAssignmentDto)
  days: DayAssignmentDto[];

  @ValidateNested()
  @Type(() => SchedulePreferencesDto)
  preferences: SchedulePreferencesDto;
}
