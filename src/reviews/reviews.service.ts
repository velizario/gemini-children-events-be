// src/reviews/reviews.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Adjust path
import { User, Role } from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
    constructor(private prisma: PrismaService) {}

    /**
     * Creates a new review for an organizer profile.
     * @param reviewer User object of the logged-in user (must be PARENT)
     * @param createReviewDto DTO containing review details
     */
    async addReview(reviewer: User, createReviewDto: CreateReviewDto) {
        // 1. Check if reviewer is a PARENT
        if (reviewer.role !== Role.PARENT) {
            throw new ForbiddenException('Only parents can write reviews.');
        }

        const { organizerProfileId, eventId, rating, comment } = createReviewDto;

        // 2. Verify the organizer profile exists
        const organizerProfile = await this.prisma.organizerProfile.findUnique({
            where: { id: organizerProfileId },
        });
        if (!organizerProfile) {
            throw new NotFoundException(`Organizer profile with ID ${organizerProfileId} not found.`);
        }

        // 3. Optional: Verify the event exists if eventId is provided
        if (eventId) {
            const event = await this.prisma.event.findUnique({ where: { id: eventId } });
            if (!event) {
                throw new NotFoundException(`Event with ID ${eventId} not found.`);
            }
            // Optional: Check if event belongs to the organizer being reviewed
            if (event.organizerId !== organizerProfile.userId) {
                 throw new BadRequestException(`Event ID ${eventId} does not belong to organizer profile ID ${organizerProfileId}.`);
            }
            // Optional: Check if the parent actually registered for this event
            // const registration = await this.prisma.registration.findUnique({
            //     where: { userId_eventId: { userId: reviewer.id, eventId: eventId } }
            // });
            // if (!registration) {
            //     throw new ForbiddenException('You can only review events you were registered for.');
            // }
        }

        // 4. Create the review
        try {
            const newReview = await this.prisma.review.create({
                data: {
                    rating: rating,
                    comment: comment,
                    reviewerId: reviewer.id,
                    organizerProfileId: organizerProfileId,
                    eventId: eventId, // Will be null if not provided
                },
                include: { // Return reviewer details with the created review
                    reviewer: { select: { firstName: true, lastName: true }}
                }
            });
            return newReview;
        } catch (error) {
            console.error(`Error creating review for organizer ${organizerProfileId} by user ${reviewer.id}:`, error);
            // Handle potential Prisma errors (e.g., foreign key constraints)
            throw new BadRequestException('Could not submit review.');
        }
    }

     // Add methods to fetch reviews later (e.g., findReviewsByOrganizer)
}

