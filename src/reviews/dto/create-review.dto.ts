// src/reviews/dto/create-review.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5) // Assuming a 1-5 star rating system
  @IsNotEmpty()
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsInt()
  @IsNotEmpty()
  organizerProfileId: number; // ID of the OrganizerProfile being reviewed

  @IsInt()
  @IsOptional()
  eventId?: number; // Optional: ID of the specific event being reviewed
}

