// src/organizers/organizers.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Adjust path if needed
import { Role } from '@prisma/client';

@Injectable()
export class OrganizersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Finds the public profile for a given organizer User ID.
   * Includes nested OrganizerProfile details and recent reviews.
   * Returns null if the user is not found or is not an organizer.
   * @param userId The ID of the User who is an organizer.
   */
  async findOrganizerProfile(userId: number) {
    console.log(`[OrganizersService] Fetching profile for organizer user ID: ${userId}`); // Logging
    const userWithProfile = await this.prisma.user.findUnique({
      where: {
        id: userId,
        role: Role.ORGANIZER, // Ensure the user is actually an organizer
      },
      select: { // Select only needed public fields + organizer profile
        id: true,
        firstName: true,
        lastName: true,
        // Exclude sensitive fields like email, password, role from public view if desired
        organizerInfo: { // Include the nested OrganizerProfile
          include: {
            // Optionally include some recent reviews directly
            reviews: {
              take: 5, // Limit number of reviews included initially
              orderBy: { createdAt: 'desc' },
              include: {
                reviewer: { // Include reviewer's name
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        }
      }
    });

    if (!userWithProfile || !userWithProfile.organizerInfo) {
        // Explicitly check if organizerInfo exists
        console.log(`[OrganizersService] Organizer profile not found for user ID: ${userId}`); // Logging
        return null; // Return null if user is not an organizer or profile doesn't exist
    }

    // Combine user info and profile info for a cleaner structure
    const { organizerInfo, ...userBase } = userWithProfile;
    console.log(`[OrganizersService] Found profile for organizer user ID: ${userId}`); // Logging
    return {
        ...userBase, // id, firstName, lastName
        ...organizerInfo // All fields from OrganizerProfile including reviews relation
    };
  }

  // Add other organizer-specific methods here later (e.g., list organizers)
}
