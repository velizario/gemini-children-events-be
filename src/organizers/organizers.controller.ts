// src/organizers/organizers.controller.ts
import { Controller, Get, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { OrganizersService } from './organizers.service';

@Controller('organizers') // Base route /organizers
export class OrganizersController {
  constructor(private readonly organizersService: OrganizersService) {}

  /**
   * Get public profile data for a specific organizer (by User ID)
   */
  @Get(':userId/profile') // Route: GET /organizers/:userId/profile
  async findOrganizerProfile(@Param('userId', ParseIntPipe) userId: number) {
    const profile = await this.organizersService.findOrganizerProfile(userId);
    if (!profile) {
      // Handle cases where the user exists but isn't an organizer or doesn't exist
      throw new NotFoundException(`Organizer profile not found for user ID ${userId}`);
    }
    return profile;
  }
}
