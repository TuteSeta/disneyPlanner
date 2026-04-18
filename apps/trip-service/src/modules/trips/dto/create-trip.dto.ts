import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateTravelerDto } from './create-traveler.dto';

export class CreateTripDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  /**
   * ISO 8601 date string (YYYY-MM-DD).
   * The service will auto-generate one TripDay per calendar day
   * between startDate and endDate (inclusive).
   */
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Optional list of travelers to associate with this trip at creation time.
   * Travelers can also be added later via a dedicated endpoint.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTravelerDto)
  travelers?: CreateTravelerDto[];
}