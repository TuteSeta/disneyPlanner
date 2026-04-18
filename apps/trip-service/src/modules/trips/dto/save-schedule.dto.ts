import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, ValidateNested } from 'class-validator';

export class ActivityDraftDto {
  @IsString() name: string;
  @IsString() activityType: string;
  @IsString() startTime: string;
  @IsString() endTime: string;
  @IsInt()    priority: number;
  @IsString() notes: string;
}

export class ActivityGroupDraftDto {
  @IsString() area: string;
  @IsInt()    sortOrder: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityDraftDto)
  activities: ActivityDraftDto[];
}

export class TimeBlockDraftDto {
  @IsString() type: string;
  @IsString() startTime: string;
  @IsString() endTime: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityGroupDraftDto)
  groups: ActivityGroupDraftDto[];
}

export class DayScheduleDto {
  @IsInt() dayId: number;
  @IsString() dayType: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeBlockDraftDto)
  timeBlocks: TimeBlockDraftDto[];
}

export class SaveScheduleDto {
  @IsInt() tripId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayScheduleDto)
  days: DayScheduleDto[];
}
