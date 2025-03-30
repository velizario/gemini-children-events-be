// src/events/dto/create-event.dto.ts
import { IsString, IsNotEmpty, IsDateString, IsOptional, MinLength, IsISO8601 } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsISO8601() // Validate date string in YYYY-MM-DDTHH:mm:ss.sssZ format
  @IsNotEmpty()
  date: string; // Receive as string, Prisma handles conversion

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  ageGroup?: string;

  // organizerId is added by the service based on the authenticated user
}