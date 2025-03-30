// src/events/dto/update-event.dto.ts
import { PartialType } from '@nestjs/mapped-types'; // Or @nestjs/swagger
import { CreateEventDto } from '../../events/dto/create-event.dto';

// Allows all fields from CreateEventDto to be optional
export class UpdateEventDto extends PartialType(CreateEventDto) {}