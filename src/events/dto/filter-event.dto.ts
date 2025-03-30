// src/events/dto/filter-event.dto.ts
import { IsOptional, IsString, IsDateString, IsISO8601 } from 'class-validator';
import { Transform } from 'class-transformer'; // Needed for transforming query params

export class FilterEventDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  ageGroup?: string;

  @IsOptional()
  @IsISO8601() // Validate if a date string is provided for filtering
  startDate?: string; // Filter events starting from this date

  @IsOptional()
  @IsString()
  searchTerm?: string; // For keyword search
}