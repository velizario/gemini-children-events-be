// src/events/events.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
// Make sure the path to PrismaService is correct for your structure
import { PrismaService } from '../../prisma/prisma.service';
// Ensure DTO paths are correct
import { CreateEventDto } from '../auth/dto/create-event.dto'; // Or wherever your DTOs actually are, e.g., './dto/...'
import { UpdateEventDto } from '../auth/dto/update-event.dto'; // Or wherever your DTOs actually are
import { FilterEventDto } from '../auth/dto/filter-event.dto'; // Or wherever your DTOs actually are
import { Prisma, Role, User } from '@prisma/client';
import { MailerService } from '@nestjs-modules/mailer'; // <--- Import MailerService
import { format } from 'date-fns'; // <--- Import date-fns for formatting

@Injectable()
export class EventsService {
    // --- Inject MailerService in the constructor ---
    constructor(
        private prisma: PrismaService,
        private readonly mailerService: MailerService // <--- Inject MailerService
    ) { }

    async create(createEventDto: CreateEventDto, user: User) {
        // 1. Check if user has the ORGANIZER role
        if (user.role !== Role.ORGANIZER) {
            throw new ForbiddenException('Only organizers can create events.');
        }

        // 2. Create event linked to the organizer
        try {
            return await this.prisma.event.create({
                data: {
                    ...createEventDto,
                    organizerId: user.id, // Link to the logged-in organizer
                },
                include: { // Optionally include organizer details in the response
                    organizer: { select: { id: true, firstName: true, lastName: true } }
                }
            });
        } catch (error) {
            // Handle potential Prisma errors if needed
            console.error("Error creating event:", error);
            throw new BadRequestException('Could not create event.');
        }
    }

    async findAll(filters: FilterEventDto) {
        const { category, ageGroup, startDate, searchTerm } = filters;
        const where: Prisma.EventWhereInput = {};

        if (category) {
            where.category = { contains: category, mode: 'insensitive' };
        }
        if (ageGroup) {
            where.ageGroup = { contains: ageGroup, mode: 'insensitive' };
        }
        if (startDate) {
            // Find events on or after the start date
            where.date = { gte: new Date(startDate) };
        }
         if (searchTerm) {
            where.OR = [ // Search in title or description
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
              { location: { contains: searchTerm, mode: 'insensitive' } }, // Add location search
            ];
          }

        return this.prisma.event.findMany({
            where,
            orderBy: { date: 'asc' }, // Order by upcoming date
            include: { // Include organizer's name
                organizer: { select: { id: true, firstName: true, lastName: true, organizerInfo: { select: { orgName: true }} } }
            }
        });
    }

     // Find events organized by a specific user
     async findMyEvents(userId: number) {
        return this.prisma.event.findMany({
            where: { organizerId: userId },
            orderBy: { date: 'desc' }, // Show most recent first
             include: {
                organizer: { select: { id: true, firstName: true, lastName: true } },
                _count: { // Count registrations for each event
                   select: { registrations: true }
                }
            }
        });
    }


    // --- Method to find registrations for the logged-in user ---
    /**
     * Finds all registrations for a given user.
     * Includes basic details of the associated event.
     * Orders by the event date (upcoming first).
     * @param userId The ID of the user whose registrations to find.
     */
    async findMyRegistrations(userId: number) {
        console.log(`Fetching registrations for user ID: ${userId}`); // Add logging
        try {
            const registrations = await this.prisma.registration.findMany({
                where: {
                    userId: userId, // Filter by the logged-in user's ID
                },
                include: {
                    // Include related event data needed by the frontend
                    event: {
                        select: {
                            id: true,
                            title: true,
                            date: true,
                            location: true,
                        },
                    },
                },
                orderBy: {
                    // Order by the date of the event, upcoming first
                    event: {
                        date: 'asc',
                    },
                },
            });
            console.log(`Found ${registrations.length} registrations for user ID: ${userId}`); // Add logging
            return registrations;
        } catch (error) {
            console.error(`Error fetching registrations for user ID ${userId}:`, error);
            // Consider throwing a more specific error if needed, but Prisma errors
            // are often handled by NestJS's exception filters.
            // For now, rethrow or throw a generic internal server error.
            throw error; // Rethrow the original error
        }
    }
    // --- END Method ---

    async findOne(id: number) {
        const event = await this.prisma.event.findUnique({
            where: { id },
             include: { // Include organizer details
                organizer: { select: { id: true, firstName: true, lastName: true, email: true, organizerInfo: true } } // Include profile info
            }
        });
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
        return event;
    }

    async update(id: number, updateEventDto: UpdateEventDto, user: User) {
        const event = await this.findOne(id); // Reuse findOne to check existence

        // Check if the logged-in user is the organizer of this event
        if (event.organizerId !== user.id && user.role !== Role.ADMIN) { // Allow ADMIN to edit too
             throw new ForbiddenException('You are not authorized to update this event.');
        }

        try {
            return await this.prisma.event.update({
                where: { id },
                data: updateEventDto,
                include: {
                     organizer: { select: { id: true, firstName: true, lastName: true } }
                }
            });
        } catch (error) {
            console.error("Error updating event:", error);
            throw new BadRequestException('Could not update event.');
        }
    }

    async remove(id: number, user: User) {
        const event = await this.findOne(id); // Check existence

        if (event.organizerId !== user.id && user.role !== Role.ADMIN) {
             throw new ForbiddenException('You are not authorized to delete this event.');
        }

         // Optional: Check if there are registrations before deleting or handle cascade delete in schema
         const registrationCount = await this.prisma.registration.count({ where: { eventId: id } });
         if (registrationCount > 0) {
             // Decide strategy: prevent deletion, or delete registrations too (cascade delete)
             // For now, let's prevent deletion if registrations exist
             throw new BadRequestException('Cannot delete event with active registrations. Please contact participants first.');
             // If using cascade delete in Prisma schema, this check isn't strictly needed,
             // but might be good UX to warn the organizer.
         }

        try {
            await this.prisma.event.delete({ where: { id } });
            return { message: `Event with ID ${id} deleted successfully.` };
        } catch (error) {
             console.error("Error deleting event:", error);
             // Handle potential errors, e.g., if related records prevent deletion (if not cascaded)
             throw new BadRequestException('Could not delete event.');
        }
    }

     // --- Updated registerForEvent method ---
     async registerForEvent(eventId: number, user: User /* removed unused p0 */) {
         // Check if user is a PARENT
         if (user.role !== Role.PARENT) {
              throw new ForbiddenException('Only parents can register for events.');
         }

         // Check if event exists (Fetch details needed for email too)
         const event = await this.prisma.event.findUnique({ where: { id: eventId } });
         if (!event) {
             throw new NotFoundException(`Event with ID ${eventId} not found`);
         }

         // Check if user is already registered (using the @@unique constraint)
         try {
              const registration = await this.prisma.registration.create({
                 data: {
                     eventId: eventId,
                     userId: user.id,
                     // Add childName, childAge from a DTO if needed
                 },
                 include: { // Include event details in response
                     event: { select: { title: true, date: true, location: true }} // Include location
                 }
             });

             // --- Send Confirmation Email ---
             try {
                 // Ensure user object has necessary fields
                 const recipientName = user.firstName || 'there';
                 const eventDateFormatted = format(new Date(event.date), 'PPPPp'); // Format date nicely

                 await this.mailerService.sendMail({
                     to: user.email, // Send to the registered parent
                     subject: `Registration Confirmed for ${event.title}`,
                     // Use text or template based on your MailerModule setup
                     // Option 1: Plain Text
                     text: `Hi ${recipientName},\n\nYou have successfully registered for the event: ${event.title}.\n\nDate: ${eventDateFormatted}\nLocation: ${event.location}\n\nWe look forward to seeing you there!\n\nBest regards,\nThe KidzEvents Team`,

                     // Option 2: Using Handlebars template (if configured)
                     // template: './registration-confirmation', // Template file name (e.g., templates/registration-confirmation.hbs)
                     // context: { // Data for the template
                     //    name: recipientName,
                     //    eventTitle: event.title,
                     //    eventDate: eventDateFormatted,
                     //    eventLocation: event.location,
                     // },
                 });
                  console.log(`Registration confirmation email sent successfully to ${user.email} for event ID ${eventId}.`);
             } catch (mailError) {
                 // Log email sending error but don't fail the overall registration process
                 console.error(`Failed to send registration confirmation email to ${user.email} for event ID ${eventId}:`, mailError);
                 // Potentially add to a retry queue or monitoring system if email is critical
             }
             // --- End Send Email ---

             return registration; // Return the created registration record

         } catch (error) {
              if (error instanceof Prisma.PrismaClientKnownRequestError) {
                 // Check for unique constraint violation (P2002)
                 if (error.code === 'P2002') {
                    throw new BadRequestException('You are already registered for this event.');
                  }
              }
              console.error(`Error creating registration for event ID ${eventId} and user ID ${user.id}:`, error);
              throw new BadRequestException('Could not register for the event.'); // Generic error for client
         }
      }

      async getEventParticipants(eventId: number, user: User) {
         const event = await this.findOne(eventId); // Reuse findOne to check existence

         // Only the event organizer or an Admin can view participants
         if (event.organizerId !== user.id && user.role !== Role.ADMIN) {
              throw new ForbiddenException('You are not authorized to view participants for this event.');
         }

         // --- Corrected where clause for participants ---
         return this.prisma.registration.findMany({
             where: { eventId: eventId }, // <--- Filter by eventId from parameter
             orderBy: { registeredAt: 'asc'},
             include: { // Include details about the registered parent
                 user: { select: { id: true, firstName: true, lastName: true, email: true } }
                 // Add childName/Age if stored on registration
             }
         });
      }
}