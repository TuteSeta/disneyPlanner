import { Type } from 'class-transformer';
import {
  IsArray,
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
  disney: ParkOptionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParkOptionDto)
  universal: ParkOptionDto[];
}

export class PlanTripDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailableParksDto)
  availableParks?: AvailableParksDto;
}
