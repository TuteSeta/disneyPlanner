import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ParkOptionDto {
  @IsString() id: string;
  @IsString() name: string;
}

export class AvailableParksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParkOptionDto)
  themeParks: ParkOptionDto[];
}

export class PlanTripDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailableParksDto)
  availableParks?: AvailableParksDto;

  @IsInt()
  @IsOptional()
  maxTokens?: number;
}

