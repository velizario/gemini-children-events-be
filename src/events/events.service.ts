// src/events/events.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
// Adjust path if needed
import { PrismaService } from '../../prisma/prisma.service';
// Adjust paths if needed
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FilterEventDto } from './dto/filter-event.dto';
import { Prisma, Role, User } from '@prisma/client';
import { MailerService } from '@nestjs-modules/mailer';
import { format } from 'date-fns';

@Injectable()
export class EventsService {
    constructor(
        private prisma: PrismaService,
        private readonly mailerService: MailerService
    ) { }

    async create(createEventDto: CreateEventDto, user: User) {
        if (user.role !== Role.ORGANIZER) {
            throw new ForbiddenException('Only organizers can create events.');
        }
        try {
            // Include price in the data being created
            return await this.prisma.event.create({
                data: {
                    title: createEventDto.title,
                    description: createEventDto.description,
                    date: createEventDto.date, // Prisma handles string -> DateTime
                    location: createEventDto.location,
                    category: createEventDto.category,
                    ageGroup: createEventDto.ageGroup,
                    price: createEventDto.price, // Handles optional price from DTO
                    organizerId: user.id,
                },
                include: { organizer: { select: { id: true, firstName: true, lastName: true } } }
            });
        } catch (error) {
            console.error("Error creating event:", error);
            throw new BadRequestException('Could not create event.');
        }
    }

    async findAll(filters: FilterEventDto) {
        const { category, ageGroup, startDate, searchTerm } = filters;
        const where: Prisma.EventWhereInput = {};

        // --- Existing Filters ---
        if (category) { where.category = { contains: category, mode: 'insensitive' }; }
        if (ageGroup) { where.ageGroup = { contains: ageGroup, mode: 'insensitive' }; }
        if (startDate) { where.date = { gte: new Date(startDate) }; }

        // --- Search Term Logic (includes category, organizer) ---
        if (searchTerm) {
            where.OR = [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
              { location: { contains: searchTerm, mode: 'insensitive' } },
              { category: { contains: searchTerm, mode: 'insensitive' } },
              { organizer: { OR: [
                    { firstName: { contains: searchTerm, mode: 'insensitive' } },
                    { lastName: { contains: searchTerm, mode: 'insensitive' } },
                    { organizerInfo: { orgName: { contains: searchTerm, mode: 'insensitive' } } }
                ]}}
            ];
          }

        return this.prisma.event.findMany({
            where,
            orderBy: { date: 'asc' },
            // Select fields needed for EventListItem, including price
            select: {
                id: true,
                title: true,
                description: true,
                date: true,
                location: true,
                category: true,
                ageGroup: true,
                price: true, // Select price
                createdAt: true,
                updatedAt: true,
                organizerId: true,
                organizer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        organizerInfo: {
                            select: { orgName: true }
                        }
                    }
                },
                _count: {
                    select: { registrations: true }
                }
            }
        });
    }

    async findMyEvents(userId: number) {
        return this.prisma.event.findMany({
            where: { organizerId: userId },
            orderBy: { date: 'desc' },
            // Select fields needed for OrganizerDashboard, including price
            select: {
                id: true,
                title: true,
                date: true,
                location: true,
                price: true, // Select price
                createdAt: true,
                _count: { select: { registrations: true } }
            }
        });
    }

     async findMyRegistrations(userId: number) {
        console.log(`Fetching registrations for user ID: ${userId}`);
        try {
            const registrations = await this.prisma.registration.findMany({
                where: { userId: userId },
                include: {
                    event: {
                        // Select fields needed by EventCard on ParentDashboard
                        select: {
                            id: true,
                            title: true,
                            date: true,
                            location: true,
                            description: true,
                            category: true,
                            ageGroup: true,
                            price: true, // Select price
                        },
                    },
                },
                orderBy: { event: { date: 'asc' } },
            });
            console.log(`Found ${registrations.length} registrations for user ID: ${userId}`);
            return registrations;
        } catch (error) {
            console.error(`Error fetching registrations for user ID ${userId}:`, error);
            throw error;
        }
    }

    async findOne(id: number) {
        const event = await this.prisma.event.findUnique({
            where: { id },
             // Include price along with other details
             include: {
                organizer: { select: { id: true, firstName: true, lastName: true, email: true, organizerInfo: true } }
            }
        });
        if (!event) { throw new NotFoundException(`Event with ID ${id} not found`); }
        return event;
    }

    async update(id: number, updateEventDto: UpdateEventDto, user: User) {
        const event = await this.findOne(id);
        if (event.organizerId !== user.id && user.role !== Role.ADMIN) {
             throw new ForbiddenException('You are not authorized to update this event.');
        }
        try {
            // Include price in the data being updated
            return await this.prisma.event.update({
                where: { id },
                data: {
                    title: updateEventDto.title,
                    description: updateEventDto.description,
                    date: updateEventDto.date,
                    location: updateEventDto.location,
                    category: updateEventDto.category,
                    ageGroup: updateEventDto.ageGroup,
                    price: updateEventDto.price, // Handles optional price from DTO
                },
                include: { organizer: { select: { id: true, firstName: true, lastName: true } } }
            });
        } catch (error) {
            console.error("Error updating event:", error);
            throw new BadRequestException('Could not update event.');
        }
    }

    async remove(id: number, user: User) {
        const event = await this.findOne(id);
        if (event.organizerId !== user.id && user.role !== Role.ADMIN) {
             throw new ForbiddenException('You are not authorized to delete this event.');
        }
        const registrationCount = await this.prisma.registration.count({ where: { eventId: id } });
        if (registrationCount > 0) {
             throw new BadRequestException('Cannot delete event with active registrations. Please contact participants first.');
        }
        try {
            await this.prisma.event.delete({ where: { id } });
            return { message: `Event with ID ${id} deleted successfully.` };
        } catch (error) {
             console.error("Error deleting event:", error);
             throw new BadRequestException('Could not delete event.');
        }
    }

     async registerForEvent(eventId: number, user: User) {
         if (user.role !== Role.PARENT) { throw new ForbiddenException('Only parents can register for events.'); }
         const event = await this.prisma.event.findUnique({ where: { id: eventId } });
         if (!event) { throw new NotFoundException(`Event with ID ${eventId} not found`); }
         try {
              const registration = await this.prisma.registration.create({
                 data: { eventId: eventId, userId: user.id },
                 include: { event: { select: { title: true, date: true, location: true }} }
             });
             try {
                 const recipientName = user.firstName || 'there';
                 const eventDateFormatted = format(new Date(event.date), 'PPPPp');
                 await this.mailerService.sendMail({
                     to: user.email,
                     subject: `Registration Confirmed for ${event.title}`,
                     text: `Hi ${recipientName},\n\nYou have successfully registered for the event: ${event.title}.\n\nDate: ${eventDateFormatted}\nLocation: ${event.location}\n\nWe look forward to seeing you there!\n\nBest regards,\nThe KidzEvents Team`,
                 });
                  console.log(`Registration confirmation email sent successfully to ${user.email} for event ID ${eventId}.`);
             } catch (mailError) {
                 console.error(`Failed to send registration confirmation email to ${user.email} for event ID ${eventId}:`, mailError);
             }
             return registration;
         } catch (error) {
              if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                 throw new BadRequestException('You are already registered for this event.');
              }
              console.error(`Error creating registration for event ID ${eventId} and user ID ${user.id}:`, error);
              throw new BadRequestException('Could not register for the event.');
         }
      }

      async getEventParticipants(eventId: number, user: User) {
         const event = await this.findOne(eventId);
         if (event.organizerId !== user.id && user.role !== Role.ADMIN) {
              throw new ForbiddenException('You are not authorized to view participants for this event.');
         }
         return this.prisma.registration.findMany({
             where: { eventId: eventId },
             orderBy: { registeredAt: 'asc'},
             include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } }
         });
      }

}
